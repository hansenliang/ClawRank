import { runOpenClawPilotIngestion } from '../src/ingestion/openclaw/run';

const result = runOpenClawPilotIngestion();
console.log(JSON.stringify(result, null, 2));
