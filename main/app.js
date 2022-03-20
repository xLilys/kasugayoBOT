require('dotenv').config();

serverIDsPath = 'data/serverIDs.json'

const fs = require('fs').promises;
const fex = require('fs');

const AsyncLock = require('async-lock/lib');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const token = process.env.TOKEN;
client.login(token);

const writeServerID = async function(id){
    const lock = new AsyncLock();
    await lock.acquire('id_rw', () => {
        fs.readFile(serverIDsPath,'utf-8')
        .then((rawdata) =>{
            var data = JSON.parse(rawdata,'utf8');
            if (data["ServerIDs"].includes(id)){
                console.log(':already exist.');
            }else{
                console.log(':new serverID');
                data["ServerIDs"].push(id);
                exportData = JSON.stringify(data);
                return fs.writeFile(serverIDsPath,exportData);
            }
        })
        .catch((e) =>{
            console.log(e);
        })
    });
}

client.on('ready',()=>{
    console.log(`${client.user.tag}`);
});

const filenameCatter = (id) =>{
    return 'data/ks_counts/'+id+'.json';
};


client.on("guildCreate",guild =>{
    console.log("registered at \n" + guild.name + '\n' +guild.id);
    //初参加時はサーバーID書き込み
    writeServerID(guild.id);
    var saveFilePath = filenameCatter(guild.id);
    if(fex.existsSync(saveFilePath)){
    }else{
        //default settings
        var newData = {
            "name":guild.name,
            "id":guild.id,
            "reaction":":middle_finger:"};
        var writeStr = JSON.stringify(newData);
        fex.writeFileSync(saveFilePath,writeStr);
    }
    console.log("Server file has generated.");
});


client.on('messageReactionAdd',async (reaction,user) => {
    const msg = reaction.message;
    console.log(reaction.emoji.name);
    //const serverFilePath = filenameCatter(message.guild.id);
});


//テスト用
client.on('messageCreate',message =>{
    if(message.author.bot)return;
    if(message.content.includes('ks')){
        message.channel.send('カス！');
    }
});

