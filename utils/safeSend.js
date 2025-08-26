// utils/safeSend.js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function safeSendMessage(bot, jid, content, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await bot.sendMessage(jid, content, options);
        } catch (err) {
            if (err?.message?.includes('rate-overlimit')) {
                console.warn(`[safeSendMessage] Rate limit hit. Attempt ${attempt}/${retries}`);
                await sleep(1500 * attempt); // exponential backoff
            } else {
                throw err; // other errors should not be retried
            }
        }
    }
    throw new Error("safeSendMessage: Failed after retries due to rate limit.");
}

module.exports = { safeSendMessage };
