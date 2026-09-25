export function readReportConfig(env:Record<string,string|undefined>=process.env) {
 const port=Number(env.REPORT_PORT??9000);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('REPORT_PORT must be an integer from 1 to 65535.');
 return {host:env.HOST??'127.0.0.1',port};
}
