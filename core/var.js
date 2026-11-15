const axios = require('axios');
const fs = require('fs');
const path = require('path'); // Add path module
const { loadJsonFile } = require('./helper');
const songdb = require('./lib/songdb').songdbF;
const settings = require('../settings.json');
const Logger = require('./utils/logger');
const logger = new Logger('VAR');

logger.info('Initializing....');

const replaceDomainPlaceholder = (obj, domain) => {
  if (typeof obj === 'string') {
    return obj.replace('{SettingServerDomainVarOJDP}', domain);
  } else if (Array.isArray(obj)) {
    return obj.map(item => replaceDomainPlaceholder(item, domain));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replaceDomainPlaceholder(obj[key], domain);
    }
    return newObj;
  }
  return obj;
};

const main = {
  skupackages: {
    pc: loadJsonFile('Platforms/jd2017-pc/sku-packages.json', '../database/Platforms/jd2017-pc/sku-packages.json'),
    nx: loadJsonFile('Platforms/jd2017-nx/sku-packages.json', '../database/Platforms/jd2017-nx/sku-packages.json'),
    wiiu: loadJsonFile('Platforms/jd2017-wiiu/sku-packages.json', '../database/Platforms/jd2017-wiiu/sku-packages.json'),
    durango: loadJsonFile('Platforms/jd2017-durango/sku-packages.json', '../database/Platforms/jd2017-durango/sku-packages.json'),
    orbis: loadJsonFile('Platforms/jd2017-orbis/sku-packages.json', '../database/Platforms/jd2017-orbis/sku-packages.json'),
  },
  entities: replaceDomainPlaceholder(require('../database/config/v2/entities.json'), settings.server.domain),
  configuration: replaceDomainPlaceholder(require('../database/config/v1/configuration.json'), settings.server.domain),
  subscription: require('../database/data/db/subscription.json'),
  packages: require('../database/config/packages.json'),
  block: require('../database/data/carousel/block.json'),
  quests: require("../database/data/db/quests.json"),
  questsnx: require("../database/data/db/quests-nx.json"),
  questspc: require("../database/data/db/quests-pc.json"),
  items: require("../database/data/db/items.json"),
  upsellvideos: require("../database/data/carousel/pages/upsell-videos.json"),
  dancemachine_pc: require("../database/data/db/dancemachine_pc.json"),
  dancemachine_nx: require("../database/data/db/dancemachine_nx.json"),
  avatars: require("../database/data/db/avatars.json"),
  dancerprofile: require("../database/data/db/dancerprofile.json"),
  aliases: require("../database/data/db/aliases.json"),
  home: require("../database/data/db/home.json"),
  jdtv: require("../database/data/db/jdtv.json"),
  playlistdb: require("../database/data/db/playlistdb.json"),
  playlists: require("../database/data/db/playlists.json"),
  create_playlist: require("../database/data/carousel/pages/create_playlist.json"),
  songdb: { "2016": {}, "2017": {}, "2018": {}, "2019": {}, "2020": {}, "2021": {}, "2022": {} },
  localisation: loadJsonFile('Platforms/openparty-all/localisation.json', '../database/Platforms/openparty-all/localisation.json')
};

main.songdb = songdb.generateSonglist();

if (main.items) {
  if (main.items.avatars) {
    for (const [id, item] of Object.entries(main.items.avatars)) {
      if (!item) continue;
      const numId = parseInt(id, 10);
      item.Id = numId;
      item.id = numId;

      const ver = item.jdVersion || item.JDNowVersion || item.JdVersion || 2017;
      item.JdVersion = ver;
      item.jdVersion = ver;
      item.jdversion = ver;

      item.Status = 1;
      item.status = 1;

      item.UnlockType = 0;
      item.unlockType = 0;

      if (item.url && typeof item.url === 'string') {
        item.url = item.url.replace('jdcn-switch.cdn.ubisoft.cn', 'jd-s3.bc5f39.workers.dev');
      }

      const mojo = item.mojoPrice !== undefined ? item.mojoPrice : (item.MojoPrice !== undefined ? item.MojoPrice : 0);
      item.MojoPrice = mojo;
      item.mojoPrice = mojo;

      item.itemType = 0;
      item.ItemType = 0;

      const sound = item.soundFamily || item.SoundFamily || "AVTR_Common_Girl_Hyper";
      item.SoundFamily = sound;
      item.soundFamily = sound;

      const song = item.relativeSongName || item.RelativeSongName || "";
      item.RelativeSongName = song;
      item.relativeSongName = song;

      const quest = item.relativeQuestID || item.RelativeQuestID || "";
      item.RelativeQuestID = quest;
      item.relativeQuestID = quest;

      const boss = item.relativeWDFBossName || item.RelativeWDFBossName || "";
      item.RelativeWDFBossName = boss;
      item.relativeWDFBossName = boss;
    }
  }
  if (main.items.skins) {
    for (const [id, item] of Object.entries(main.items.skins)) {
      if (!item) continue;
      const numId = parseInt(id, 10);
      item.Id = numId;
      item.id = numId;

      const ver = item.jdVersion || item.JDNowVersion || item.JdVersion || 2017;
      item.JdVersion = ver;
      item.jdVersion = ver;
      item.jdversion = ver;

      item.Status = 1;
      item.status = 1;

      item.UnlockType = 0;
      item.unlockType = 0;

      item.itemType = 1;
      item.ItemType = 1;

      if (item.url && typeof item.url === 'string') {
        item.url = item.url.replace('jdcn-switch.cdn.ubisoft.cn', 'jd-s3.bc5f39.workers.dev');
      }
    }
  }
}

module.exports = {
  main
}
