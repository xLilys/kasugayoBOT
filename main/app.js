require('dotenv').config();

serverIDsPath = 'data/serverIDs.json'

const fs = require('fs').promises;
const fex = require('fs');

const AsyncLock = require('async-lock/lib');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const token = process.env.TOKEN;
client.login(token);

const writeServerID = async function(guild){
    const id = guild.id;
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


const createServerFile = (guild)=>{
    var saveFilePath = filenameCatter(guild.id);
    if(fex.existsSync(saveFilePath)){
    }else{
        //default settings
        var newData = {
            "name":guild.name,
            "id":guild.id,
            "reaction":"🖕"};
        var writeStr = JSON.stringify(newData);
        fex.writeFileSync(saveFilePath,writeStr);
    }
}

client.on("guildCreate",guild =>{
    console.log("registered at \n" + guild.name + '\n' +guild.id);
    //初参加時はサーバーID書き込み
    writeServerID(guild);
    createServerFile(guild);
    console.log("Server file has generated.");
});


client.on('messageReactionAdd',async (reaction,user) => {
    const msg = reaction.message;
    const serverFilePath = filenameCatter(msg.guild.id);
    if(fex.existsSync(serverFilePath)){
    }else{
        createServerFile(msg.guild);
    }
    var ks_reaction = null;
    const lock = new AsyncLock();
    await lock.acquire('reaction_get', () => {
        fs.readFile(serverFilePath,'utf-8')
        .then((rawdata) =>{
            var data = JSON.parse(rawdata);
            ks_reaction = data["reaction"];
            if(reaction.emoji.name != ks_reaction){
                return;
            }else{
                console.log("p");
                /*
                if(data["messages"] in msg.id){
                    if(data["messages"][msg.id]["pushed_users"] in user.tag){
                        
                    }
                }
                */
                
            }
        })
        .catch((e)=>{
            console.log(e);
        })
    });
    
});


//テスト用
client.on('messageCreate',message =>{
    if(message.author.bot)return;
    if(message.content.includes('ks')){
        message.channel.send('カス！');
    }
});

