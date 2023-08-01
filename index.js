const dotenv = require("dotenv");
dotenv.config();
const axios = require('axios');
const Contest = require('./models/Contest');
const connectDB = require('./db');
const cron = require("node-cron");
connectDB();
const makeWASocket = require("@whiskeysockets/baileys").default;
const store = {};
const {
    DisconnectReason,
    useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const getMessage = (key) => {
    const { id } = key;
    if (store[id]) return store[id].message;
};
// const getText = (message) => {
//     try {
//         return (
//             message.conversation ||
//             message.extendedTextMessage.text ||
//             message.imageMessage.caption
//         );
//     } catch {
//         return "";
//     }
// };


async function WABot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        getMessage,
    });
    const sendMessage = async (jid, content) => {
        try {
            const sent = await sock.sendMessage(jid, content);
            store[sent.key.id] = sent;
        } catch (err) {
            console.error("Error sending message: ", err);
        }
    };
    async function run() {
        try {
            
            const contests = await Contest.find({ start_time: { $gte: new Date(), $lte: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}}).sort({ start_time: 1 });

            let text = "*-------🚀 Upcoming Contests List 🔮------*";
            contests.forEach(async function (item, index) {
                let startTime = new Date(item.start_time).toLocaleString("en-GB", { timeZone: 'Asia/Kolkata' });

                text += "\n*--------------------------------------------------*\n";
                text += `🎯 *Contest*: _${item.name}_\n⏱️ *Start*: _${startTime}_\n💫 *Link*: _${item.link}_\n⭐ *Source*: _${item.source}_`;
                text += "\n*--------------------------------------------------*\n";

            })
            text += "🔥  *All the Best*  🔥"
            if(contests.length!==0){

            await sendMessage(process.env.GROUPID, { text: text });
            }
        } catch (err) {
            console.log(err);
        }
    }
    //SENDING NOTIFICATIONS AT 7:30AM    
    cron.schedule(" 30 7 * * *", async () => {
        try {
            console.log("job executed at 7:30 AM");
            run().catch((err) => {
                console.log(err);
            });
        } catch (err) {
            console.log(err);
        }
    }).start();

    //SENDING NOTIFICATIONS AT 7:30PM
    cron.schedule(" 30 19 * * *", async () => {
        try {
            console.log("job executed at 7:30 PM");
            run().catch((err) => {
                console.log(err);
            });
        } catch (err) {
            console.log(err);
        }
    }).start();

    sock.ev.process(async (events) => {
        if (events["connection.update"]) {
            const { connection, lastDisconnect } = events["connection.update"];
            if (connection === "close") {
                if (
                    lastDisconnect?.error?.output?.statusCode !==
                    DisconnectReason.loggedOut
                ) {
                    WABot();
                } else {
                    console.log("Disconnected because you logged out");
                }
            }
        }
        if (events["creds.update"]) {
            await saveCreds();
        }
        // if (events["messages.upsert"]) {
        //     const { messages } = events["messages.upsert"];
        //     messages.forEach((msg) => {
        //         // processing
        //         if (getText(msg.message).startsWith("@hi")) {
        //             console.log(msg.key.remoteJid);
        //         }
        //     });
        // }
    });





}

const saveContest = cron.schedule(" 0 0 * * *", async () => {
    try {
        console.log("job executed");
        const response = await axios.get(`https://clist.by:443/api/v3/contest/?username=${process.env.API_USERNAME}&api_key=${process.env.API_KEY}&total_count=true&upcoming=true&resource=leetcode.com%2Ccodingninjas.com%2Fcodestudio%2Cgeeksforgeeks.org%2Chackerearth.com%2Ccodeforces.com%2Cmy.newtonschool.co%2Ccodechef.com&start__gt=${new Date().toISOString()}&order_by=start&limit=150`);

        const contests = response.data.objects;
        contests.forEach(async function (item, index) {
            const record = await Contest.findOne({ id: item.id });

            if (record) {
                return;
            }

            const contest = new Contest({
                name: item.event,
                start_time: new Date(item.start+"Z").toISOString(),
                end_time: new Date(item.end+"Z").toISOString(),
                link: item.href,
                source: item.resource,
                id: item.id
            })
            await contest.save();

        })

        console.log("job executed successfully");
        return;
    } catch (err) {
        console.log(err);
        return;
    }
})

WABot();
saveContest.start();




