import path from 'path'
import {
  pino,
  TransportTargetOptions,
  type Logger,
  type LoggerOptions,
} from 'pino'

import { env } from '@/lib/env'

import { createFileTransport, createConsoleTransport } from './utils'

// isDev constant is use to select proper transports for different environments
const LOG_DIR = env.LOG_DIR || 'logs'
const LOG_LEVEL = env.LOG_LEVEL || 'info'
const isDev = process.env.NODE_ENV === 'development'
const LOG_TO_FILE_PROD = env.LOG_TO_FILE_PROD || false
const LOG_TO_FILE_DEV = env.LOG_TO_FILE_DEV || false

const targets: TransportTargetOptions[] = []

if (LOG_TO_FILE_PROD || LOG_TO_FILE_DEV) {
  const logFile = path.join(process.cwd(), LOG_DIR, 'server.log')
  const fileTarget = createFileTransport(logFile, LOG_DIR)
  if (fileTarget) {
    targets.push(fileTarget)
  } else {
    console.error('Failed to create pino file transport')
  }
}

if (isDev) {
  targets.push(createConsoleTransport())
}

// Common logger options
const options: LoggerOptions = {
  level: LOG_LEVEL,
}

let transport
// if there will be no targets, following logger will be used
let logger: Logger = pino({ enabled: false })

if (targets.length > 0) {
  try {
    transport = pino.transport({
      targets,
    })
    logger = pino(options, transport)
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error setting up logger transport.')
      console.error(err)
    } else {
      console.error('Unknown error occurred while setting up logger transport.')
      console.error(err)
    }
  }
}

export default logger
