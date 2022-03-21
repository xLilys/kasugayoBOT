require('dotenv').config();

serverIDsPath = 'data/serverIDs.json'

const fs = require('fs').promises;

const AsyncLock = require('async-lock/lib');
const { Client, Intents } = require('discord.js');
const { mainModule } = require('process');
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


const createServerFile = async (guild)=>{
    var saveFilePath = filenameCatter(guild.id);
    const fex = require('fs');
    if(fex.existsSync(saveFilePath)){
    }else{
        var newData = {
            "name":guild.name,
            "id":guild.id,
            "reaction":"🖕",
            "messages":[]
        };
        var writeStr = JSON.stringify(newData);
        const lock = new AsyncLock();
        await lock.acquire('create_serverfile',()=>{
            fs.writeFile(saveFilePath,writeStr);
        });
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
    //2時間以上前のメッセージへのリアクションはカウントしない
    if((new Date().getTime()) - reaction.message.createdTimestamp > 2 * 60 * 60 * 1000)return;
    //console.log(reaction);

    const msg = reaction.message;

    //自分で自分のカウントはできない
    if(user.tag == msg.author.tag)return;

    //BOTによるリアクションと、BOTのメッセージに対してカウントしない
    if(user.bot)return;
    if(msg.author.bot)return;

    const serverFilePath = filenameCatter(msg.guild.id);
    createServerFile(msg.guild);
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
                var alreadyCreated = false;
                var index = 0;
                for(const [i,elem] of data["messages"].entries()){
                    if(elem["id"] == msg.id){
                        alreadyCreated = true;
                    }
                }

                if(alreadyCreated){
                    //nanimo=sinai
                }else{
                    data["messages"].push({"id":msg.id,"author":msg.author.tag,"timestamp":new Date().getTime(),"pushed_users":[],"ks":0});
                }

                var alreadySent = false;
                index = 0;
                for(const [i,elem] of data["messages"].entries()){
                    if(elem["id"] == msg.id){
                        index = i;
                        if(data["messages"][index]["pushed_users"].includes(user.tag)){
                            alreadySent = true;
                            break;
                        };
                    }
                }
                if(alreadySent){
                    //no count
                }else{
                    //console.log("ks!");
                    data["messages"][index]["ks"] += 1;
                    data["messages"][index]["pushed_users"].push(user.tag);
                }

                var outputstr = JSON.stringify(data);
                return fs.writeFile(serverFilePath,outputstr);
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

const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime));
const ks_collector = async () =>{
    while(true){
        console.log("fkan");
        await sleep(2 * 60 * 1000);
    }
}

ks_collector();