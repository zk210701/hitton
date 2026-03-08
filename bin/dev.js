#!/usr/bin/env node

import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const command = 'node';
const args = ['--watch', 'src/server.js'];

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('启动失败:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`进程退出，代码: ${code}, 信号: ${signal}`);
  process.exit(code);
});
