const Discord = require('discord.js');
const chalk = require('chalk');
const config = require('./config.json');
const client = new Discord.Client({
    intents: [
        'GUILDS',
        'DIRECT_MESSAGES',
        'GUILD_MESSAGES',
        'GUILD_MEMBERS',
        'GUILD_PRESENCES'
    ]
});
require("./functions/slash-register.js")();
let commands = require("./functions/slash-register.js").commands;
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./functions/clansDatabase.sqlite3', (err) => {
    if(err) return console.log(err);
});
let clanAt

client.on('ready', () => {
    console.log(`\n------ [ ${chalk.green("BOT IS ONLINE")} ] ------\n${chalk.yellow("Logged in as:")} ${client.user.tag}\n${chalk.yellow("Made by:")} Amino#4229\n${chalk.yellow("Support Discord:")} discord.gg/RVePam7pd7\n-------------------------------`);
    client.user.setPresence({ activities: [{ type: `${config.BOT_STATUS['Type: PLAYING, STREAMING, LISTENING, WATCHING']}`, name: `${config.BOT_STATUS.Message}` }], status: `${config.BOT_STATUS['Status: online, dnd, invisible, idle']}` });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

    let name = interaction.commandName;
    let options = interaction.options;

    let commandMethod = commands.get(name);
    if(!commandMethod) return;

    await interaction.deferReply({ ephemeral: true });

    commandMethod(client, interaction);
});

setInterval(() => {
    db.serialize(() => {
        db.all("SELECT * from clans;", async function(err, table) {
            if(err) return console.log(err);
            table.forEach(async clan => {
                if(clan.clan_chat !== null && clan.clan_info_id !== null) {
                    const theGuild = client.guilds.cache.get(config.DISCORD_SERVER_ID);
                    const clanChannel = theGuild.channels.cache.get(clan.clan_chat);
                    if(!clanChannel) return;
                    const clanMessage = await clanChannel.messages.fetch(clan.clan_info_id);
                    if(!clanMessage) return;
    
                    let owners = [];
                    let moderators = [];
                    let members = [];
    
                    db.all("SELECT * from clan_data where clan_id = "+ clan.clan_id +";", async function(err, memberResults) {
                        if(err) return console.log(err);
                        if(memberResults.length > 0) {
                            memberResults.forEach(user =>  {
                                if(user.member_type == "owner" || user.member_type == "theowner") {
                                    owners.push(`<@${user.member_id}>`);
                                    members.push(`<@${user.member_id}>`);
                                } else if(user.member_type == "moderator") {
                                    moderators.push(`<@${user.member_id}>`);
                                    members.push(`<@${user.member_id}>`);
                                } else if(user.member_type == "member") {
                                    members.push(`<@${user.member_id}>`);
                                }
                            });
    
                            if(moderators.length == 0) {
                                moderators.push("No moderators")
                            }
    
                            try {
    
                            const embed = new Discord.MessageEmbed()
                            .setTitle(`${clan.clan_name.toUpperCase()} Clan`)
                            .setFooter({ text: "Last updated" })
                            .setTimestamp()
                            if(clan.clan_color !== "null") embed.setColor(clan.clan_color);
    
                            if(clan.clan_logo !== "null") embed.setThumbnail(clan.clan_logo);
    
                            if(clan.clan_banner !== "null") embed.setImage(clan.clan_banner);
    
                            if(clan.clan_discord !== "null") {
                                embed.setDescription(`**Clan owner:**\n${owners.join(", ")}\n\n**Clan moderators:**\n ${moderators.join(", ")}\n\n**Clan members:**\n ${members.join(", ")}\n\nClan discord [here](${clan.clan_discord})`)
                            } else {
                                embed.setDescription(`**Clan owner:**\n${owners.join(", ")}\n\n**Clan moderators:**\n ${moderators.join(", ")}\n\n**Clan members:**\n ${members.join(", ")}`)
                            }
    
                            clanMessage.edit({
                                embeds: [embed]
                            });
    
                        } catch (err) {
                            console.log(err)
                        }
                        }
                    });
                }
            });
        });
    });     
}, 10000);

client.login(config.BOT_TOKEN);
