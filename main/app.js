require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const token = process.env.TOKEN;
client.login(token);

client.on('ready',()=>{
    console.log(`${client.user.tag}`);
});

client.on("guildCreate",guild =>{
    console.log("registered at \n" + guild.name + '\n' +guild.id);
});


//テスト用
client.on('messageCreate',message =>{
    if(message.author.bot)return;
    if(message.content.includes('ks')){
        message.channel.send('カス！');
    }
});

