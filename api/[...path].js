import { createApp } from '../src/index.js';
const app = createApp();
export default function handler(req, res) {
    app(req, res);
}
