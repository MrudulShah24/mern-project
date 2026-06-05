const vm = require('vm');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Executes JavaScript code in an isolated V8 VM context.
 * Intercepts console logs and sets a strict execution timeout.
 */
function executeJS(code) {
  const logs = [];
  const sandbox = {
    console: {
      log: (...args) => {
        logs.push(args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        }).join(' '));
      },
      error: (...args) => {
        logs.push('[ERROR] ' + args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        }).join(' '));
      },
      warn: (...args) => {
        logs.push('[WARN] ' + args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        }).join(' '));
      },
      info: (...args) => {
        logs.push('[INFO] ' + args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        }).join(' '));
      }
    }
  };

  const context = vm.createContext(sandbox);
  try {
    const script = new vm.Script(code);
    const result = script.runInContext(context, { timeout: 1000 });
    return {
      success: true,
      output: logs.join('\n'),
      result: result
    };
  } catch (err) {
    return {
      success: false,
      output: logs.join('\n'),
      error: err.message || String(err)
    };
  }
}

/**
 * Executes Python code by spawning a temporary python sub-process.
 * Safely handles script execution timeout and cleans up files.
 */
function executePython(code, stdinVal = '') {
  return new Promise((resolve) => {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const filename = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`;
    const filepath = path.join(tempDir, filename);

    fs.writeFileSync(filepath, code);

    const runProcess = (cmd) => {
      return new Promise((res, rej) => {
        const child = spawn(cmd, [filepath]);
        let stdout = '';
        let stderr = '';

        const timeoutId = setTimeout(() => {
          child.kill('SIGKILL');
          rej(new Error('Script execution timed out (limit 2s).'));
        }, 2000);

        if (stdinVal) {
          try {
            child.stdin.write(stdinVal);
            child.stdin.end();
          } catch (e) {
            // child.stdin might be closed already
          }
        }

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('error', (err) => {
          clearTimeout(timeoutId);
          rej(err);
        });

        child.on('close', (code) => {
          clearTimeout(timeoutId);
          res({ code, stdout, stderr });
        });
      });
    };

    runProcess('python')
      .catch((err) => {
        if (err.code === 'ENOENT') {
          return runProcess('python3');
        }
        throw err;
      })
      .then((result) => {
        // Clean up
        try {
          fs.unlinkSync(filepath);
        } catch (e) {}

        resolve({
          success: result.code === 0,
          output: result.stdout,
          error: result.stderr || (result.code !== 0 ? `Exit code ${result.code}` : undefined)
        });
      })
      .catch((err) => {
        // Clean up
        try {
          fs.unlinkSync(filepath);
        } catch (e) {}

        if (err.code === 'ENOENT') {
          resolve({
            success: false,
            output: '',
            error: 'Python is not installed or not in the system PATH. Please install Python to run Python exercises.'
          });
        } else {
          resolve({
            success: false,
            output: '',
            error: err.message || String(err)
          });
        }
      });
  });
}

/**
 * General router to execute code in supported languages.
 */
async function execute(code, language, stdinVal = '') {
  switch (language.toLowerCase()) {
    case 'javascript':
      return executeJS(code);
    case 'python':
      return await executePython(code, stdinVal);
    default:
      return {
        success: false,
        output: '',
        error: `Execution for language "${language}" is not configured in this local sandbox. Please use JavaScript or Python.`
      };
  }
}

module.exports = {
  execute,
  executeJS,
  executePython
};
