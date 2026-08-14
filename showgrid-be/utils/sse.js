// In-process Server-Sent Events hub (single instance).
// Scale note: when we run 2+ API instances, move this to Redis pub/sub.
const clients = new Map(); // userId -> Set<http.ServerResponse>

// Register a stream response for a userId; auto-removes on disconnect.
const addClient = (userId, res) => {
    let set = clients.get(userId);
    if (!set) {
        set = new Set();
        clients.set(userId, set);
    }
    set.add(res);
    res.on('close', () => {
        set.delete(res);
        if (set.size === 0) clients.delete(userId);
    });
};

const countClients = () => {
    let n = 0;
    for (const set of clients.values()) n += set.size;
    return n;
};

// Push an SSE event to every open stream for a userId. Best-effort: a stream
// that died between heartbeat and now is dropped silently.
const broadcastTo = (userId, event, data) => {
    const set = clients.get(userId);
    if (!set || set.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
        try {
            res.write(payload);
        } catch (err) {
            set.delete(res);
        }
    }
};

module.exports = { addClient, broadcastTo, countClients };
