require('dotenv').config();

serverIDsPath = 'data/serverIDs.json'

const fs = require('fs').promises;

const AsyncLock = require('async-lock/lib');
const { mainModule } = require('process');
const twemojiRegex = require('twemoji-parser/dist/lib/regex').default;


const { Client, Intents, CommandInteractionOptionResolver } = require('discord.js');
const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const ks_timeout = 30 * 1000;//(ms)

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
            "reaction":'🖕',
            "messages":[]
        };
        var writeStr = JSON.stringify(newData);
        const lock = new AsyncLock();
        await lock.acquire('serverfile_rw',()=>{
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
    if(((new Date().getTime()) - reaction.message.createdTimestamp) > ks_timeout)return;
    //console.log(reaction);

    const msg = reaction.message;

    //自分で自分のカウントはできない
    if(user.id == msg.author.id)return;

    //BOTによるリアクションと、BOTのメッセージに対してカウントしない
    if(user.bot)return;
    if(msg.author.bot)return;

    const serverFilePath = filenameCatter(msg.guild.id);
    createServerFile(msg.guild);

    var ks_reaction = null;
    const lock = new AsyncLock();
    await lock.acquire('serverfile_rw', () => {
        fs.readFile(serverFilePath,'utf-8')
        .then((rawdata) =>{
            var data = JSON.parse(rawdata);
            ks_reaction = data["reaction"];
            var em = null;

            if(reaction.emoji.name.match(twemojiRegex)){
                em = reaction.emoji.name;
            }else{
                em = '<:' + reaction.emoji.identifier + '>';
            }

            if(em != ks_reaction){
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
                    data["messages"].push({"id":msg.id,"author":{"id":msg.author.id,"name":msg.author.tag},"timestamp":new Date().getTime(),"pushed_users":[],"ks":0});
                }

                var alreadySent = false;
                index = 0;
                for(const [i,elem] of data["messages"].entries()){
                    if(elem["id"] == msg.id){
                        index = i;
                        if(data["messages"][index]["pushed_users"].includes(user.id)){
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
                    data["messages"][index]["pushed_users"].push(user.id);
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

client.on('messageCreate',async (message) =>{
    if(message.author.bot)return;


    var cmd = message.content.split(' ');
    if(cmd.length == 0)return;

    if(cmd[0] == '!ksgayo'){
        if(cmd[1] == 'rchange'){
            if(cmd[2] == null)return;
            const lock = new AsyncLock();
            await lock.acquire('serverfile_rw',() => {
                fs.readFile(filenameCatter(message.guild.id),'utf-8')
                .then((rawdata) => {
                    var data = JSON.parse(rawdata);
                    data["reaction"] = cmd[2];
                    var outstr = JSON.stringify(data);
                    client.channels.cache.get(message.channelId).send('カスリアクションが' + cmd[2] + 'に変更されました');
                    return fs.writeFile(filenameCatter(message.guild.id),outstr);
                })
                .catch((e) => {
                    console.log(e);
                })
            })
        }
    }
});


const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime));
const ks_collector = async () =>{
    while(true){
        var ids = null;
        var users = null;
        const ulock = new AsyncLock();
        await ulock.acquire('users_rw',() => {
            fs.readFile('data/users.json','utf-8')
            .then((userdata_raw) => {
                return JSON.parse(userdata_raw);
            })
            .then((t) => {//kuso
                users = t;
            })
        });

        const lock = new AsyncLock();
        await lock.acquire('id_rw',() =>{
            fs.readFile('data/serverIDs.json','utf-8')
            .then((rawdata) => {
                var data = JSON.parse(rawdata);
                ids = data["ServerIDs"];
                return ids;
            })
            .then((ids) =>{
            for(const id of ids){
                const lock2 = new AsyncLock();
                lock2.acquire('serverfile_rw', () => {
                        fs.readFile(filenameCatter(id),'utf-8')
                        .then((serverdata_raw) => {
                            return JSON.parse(serverdata_raw);
                        })
                        .then((serverdata) =>{
                            for(const [index,msg] of serverdata["messages"].entries()){
                                if(((new Date().getTime()) - serverdata["messages"]["timestamp"]) < ks_timeout){
                                    continue;
                                }
                                //新しいユーザーを検出
                                var ks_exist = false;
                                var ks_pos = 0;
                                for(const [i,elem] of users["users"].entries()){
                                    if(elem["id"] == msg["author"]["id"]){
                                        ks_exist = true;
                                        ks_pos = i;
                                        break;
                                    }
                                }

                                if(ks_exist){
                                    //全体カス
                                    users["users"][ks_pos]["ks"] += msg["ks"];

                                    //サーバー別カス
                                    var sk_ex = false;
                                    var spos = 0;
                                    users["users"][ks_pos]["Servers"].includes(serverdata["id"])
                                    for(const [j,s] of users["users"][ks_pos]["Servers"].entries()){
                                        if(s["id"] == serverdata["id"]){
                                            sk_ex = true;
                                            spos = j;
                                            break;
                                        }   
                                    }

                                    if(sk_ex){
                                        //すでに存在カス
                                        users["users"][ks_pos]["Servers"][spos]["ks"] += msg["ks"];
                                    }else{
                                        //新規サーバーカス
                                        users["users"][ks_pos]["Servers"].push({"id":serverdata["id"],"ks":msg["ks"]});
                                    }

                                }else{
                                    //新しいユーザーの登録
                                    users["users"].push({"id":msg["author"]["id"],"name":msg["author"]["name"],"ks":msg["ks"],"Servers":[{"id":serverdata["id"],"ks":msg["ks"]}]});
                                    users["registered"] += 1;
                                }

                            }

                            serverdata["messages"] = serverdata["messages"].filter((msg) => {
                                return (((new Date().getTime()) - serverdata["messages"].timestamp) > ks_timeout)
                            });

                            var serverdata_strout = JSON.stringify(serverdata);
                            var user_strout = JSON.stringify(users);


                            fs.writeFile(filenameCatter(id),serverdata_strout);
                            return fs.writeFile('data/users.json',user_strout);
                        })
                        .catch((e) => {
                            if(e.code == 'ENOENT'){
                                console.log('Server file is not found.\nserverID:'+id);
                            }else{
                                console.log(e);
                            }
                        });
                    })
                }
            })
            .catch((e) => {
                console.log(e);
            });
        });
        await sleep(ks_timeout);
    }
};

ks_collector();

