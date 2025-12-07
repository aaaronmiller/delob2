import fs from 'fs';
import { watch } from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';

/**
 * Log Reader
 *
 * Watches .delobotomize/proxy.log for new lines using file system notifications.
 * Emits 'line' events for each new TSV line.
 */
export class LogReader extends EventEmitter {
  private watcher: any;
  private lastPosition: number = 0;
  private logPath: string;

  constructor(logPath: string) {
    super();
    this.logPath = logPath;
  }

  async start(): Promise<void> {
    // Ensure log file exists
    if (!fs.existsSync(this.logPath)) {
      // Create empty log file
      await fs.promises.writeFile(this.logPath, '');
    }

    // Get current file size
    const stats = await fs.promises.stat(this.logPath);
    this.lastPosition = stats.size;

    // Watch for file changes
    this.watcher = watch(this.logPath, {
      persistent: true,
      ignoreInitial: false
    });

    this.watcher.on('change', async () => {
      await this.readNewLines();
    });

    this.emit('started');
  }

  private reading: boolean = false;

  async readNewLines(): Promise<void> {
    if (this.reading) return;
    this.reading = true;

    try {
      const stats = await fs.promises.stat(this.logPath);
      const currentSize = stats.size;

      if (currentSize > this.lastPosition) {
        // Read from last position to end
        const stream = fs.createReadStream(this.logPath, {
          start: this.lastPosition,
          end: currentSize,
          encoding: 'utf-8'
        });

        let buffer = '';

        stream.on('data', (chunk: string) => {
          buffer += chunk;
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          // Emit complete lines
          for (const line of lines) {
            if (line.trim()) {
              this.emit('line', line);
            }
          }
        });

        await new Promise<void>((resolve, reject) => {
          stream.on('end', () => {
            this.lastPosition = currentSize;
            resolve();
          });
          stream.on('error', (error) => reject(error));
        });
      }
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.reading = false;
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.emit('stopped');
    }
  }
}
