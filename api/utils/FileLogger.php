<?php

/**
 * File Logger for API Debug Logging
 * Logs all major operations to a file for debugging purposes
 */
class FileLogger
{
    private $logFile;
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    private $logsDirectory = __DIR__ . '/../logs';

    public function __construct()
    {
        // Create logs directory if it doesn't exist
        if (!is_dir($this->logsDirectory)) {
            mkdir($this->logsDirectory, 0755, true);
        }

        $this->logFile = $this->logsDirectory . '/admin-' . date('Y-m-d') . '.log';

        // Rotate log if it exceeds max size
        if (file_exists($this->logFile) && filesize($this->logFile) > $this->maxFileSize) {
            rename(
                $this->logFile,
                $this->logFile . '.' . time()
            );
        }
    }

    /**
     * Log a message with context
     */
    public function log($level, $module, $message, $data = null)
    {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = sprintf(
            "[%s] [%s] [%s] %s",
            $timestamp,
            strtoupper($level),
            $module,
            $message
        );

        if (!is_null($data)) {
            $logEntry .= " | Data: " . json_encode($data, JSON_UNESCAPED_SLASHES);
        }

        $logEntry .= PHP_EOL;

        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }

    public function debug($module, $message, $data = null)
    {
        $this->log('DEBUG', $module, $message, $data);
    }

    public function info($module, $message, $data = null)
    {
        $this->log('INFO', $module, $message, $data);
    }

    public function warn($module, $message, $data = null)
    {
        $this->log('WARN', $module, $message, $data);
    }

    public function error($module, $message, $data = null)
    {
        $this->log('ERROR', $module, $message, $data);
    }

    /**
     * Get recent logs
     */
    public function getRecentLogs($lines = 100)
    {
        if (!file_exists($this->logFile)) {
            return [];
        }

        $file_handle = fopen($this->logFile, 'r');
        $logs = [];

        fseek($file_handle, 0, SEEK_END);
        $file_size = ftell($file_handle);
        $buffer_size = min(4096, $file_size);

        $position = $file_size;
        $line_count = 0;

        while ($line_count < $lines && $position > 0) {
            $position -= min($buffer_size, $position);
            fseek($file_handle, $position);
            $chunk = fread($file_handle, $buffer_size);
            $chunk_lines = explode(PHP_EOL, $chunk);

            foreach (array_reverse($chunk_lines) as $line) {
                if ($line !== '' && $line_count < $lines) {
                    array_unshift($logs, $line);
                    $line_count++;
                }
            }
        }

        fclose($file_handle);
        return $logs;
    }
}

$GLOBALS['fileLogger'] = new FileLogger();
