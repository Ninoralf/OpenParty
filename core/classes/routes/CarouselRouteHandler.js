/**
 * Carousel Route Handler for OpenParty
 * Handles carousel and related content routes
 */
const RouteHandler = require('./RouteHandler');
const CarouselService = require('../../services/CarouselService');
const coreMain = require('../../var').main; // Assuming core.main is needed for various carousel data
const Logger = require('../../utils/logger');
const AccountService = require('../../services/AccountService'); // Import AccountService to get profileId

class CarouselRouteHandler extends RouteHandler {
    constructor() {
        super('CarouselRouteHandler');
        this.logger = new Logger('CarouselRouteHandler');

        // Bind handler methods to maintain 'this' context
        this.handleCarousel = this.handleCarousel.bind(this);
        this.handleCarouselPages = this.handleCarouselPages.bind(this);
        this.handleUpsellVideos = this.handleUpsellVideos.bind(this);
    }

    /**
     * Initialize the routes
     * @param {Express} app - The Express application instance
     */
    initroute(app) {
        this.logger.info(`Initializing routes...`);

        // Carousel routes
        const pages = [
            'avatars', 'avatars-creation', 'dancerprofile', 'friend-dancerprofile',
            'jdtv', 'jdtv-nx', 'quests', 'create-playlist', 'skins', 'skins-creation'
        ];
        for (const p of pages) {
            this.registerPost(app, `/carousel/v2/pages/${p}`, this.handleCarousel);
            this.registerGet(app, `/carousel/v2/pages/${p}`, this.handleCarousel);
            this.registerPost(app, `/carousel/:version/pages/${p}`, this.handleCarousel);
            this.registerGet(app, `/carousel/:version/pages/${p}`, this.handleCarousel);
            this.registerPost(app, `/${p}`, this.handleCarousel);
            this.registerGet(app, `/${p}`, this.handleCarousel);
        }
        this.registerPost(app, "/carousel/v2/pages/upsell-videos", this.handleUpsellVideos);
        this.registerGet(app, "/carousel/v2/pages/upsell-videos", this.handleUpsellVideos);
        this.registerPost(app, "/carousel/:version/pages/:mode", this.handleCarouselPages);
        this.registerGet(app, "/carousel/:version/pages/:mode", this.handleCarouselPages);

        this.logger.info(`Routes initialized`);
    }

    /**
     * Handle carousel requests for static data (avatars, dancerprofile, jdtv, quests)
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleCarousel(req, res) {
        const path = req.path.split('?')[0].split('/').filter(Boolean).pop();
        this.logger.info(`Serving carousel page: ${path}`);
        switch (path) {
            case 'avatars':
                res.send(this.getAvatarsCarousel(false));
                break;
            case 'avatars-creation':
                res.send(this.getAvatarsCarousel(true));
                break;
            case 'dancerprofile':
            case 'friend-dancerprofile':
                res.send(coreMain.dancerprofile);
                break;
            case 'jdtv':
            case 'jdtv-nx':
                res.send(coreMain.jdtv);
                break;
            case 'quests':
                res.send(coreMain.quests);
                break;
            case 'create-playlist':
                res.send(coreMain.create_playlist);
                break;
            case 'skins':
                res.send(this.getSkinsCarousel(false));
                break;
            case 'skins-creation':
                res.send(this.getSkinsCarousel(true));
                break;
            default:
                res.status(404).send('Not found');
        }
    }

    /**
     * Get avatars carousel structure with explicit items and normalized offlineRequest
     * @param {boolean} isCreation - Whether this is for initial dancer profile creation
     * @returns {Object} Carousel content for avatars
     */
    getAvatarsCarousel(isCreation = false) {
        const avatarsData = JSON.parse(JSON.stringify(coreMain.avatars));
        if (!avatarsData.actionLists) avatarsData.actionLists = {};
        avatarsData.actionLists.SelectAvatarOffline = {
            "__class": "ActionList",
            "actions": [
                {
                    "__class": "Action",
                    "bannerType": "dancer",
                    "title": "Select avatar",
                    "type": "select-avatar"
                }
            ],
            "itemType": "avatar"
        };

        const itemIsc = "avatar_item";
        const catAct = "avatar_carousel";
        const catIsc = "avatar_row";

        for (const cat of (avatarsData.categories || [])) {
            cat.act = catAct;
            cat.isc = catIsc;
            for (const item of (cat.items || [])) {
                item.actionList = "SelectAvatarOffline";
                if (item.offlineRequest) {
                    const ver = item.offlineRequest.jdVersion || item.offlineRequest.jdversion || 2017;
                    item.offlineRequest.actionListName = "SelectAvatarOffline";
                    item.offlineRequest.jdversion = ver;
                    item.offlineRequest.jdVersion = ver;
                    item.offlineRequest.lockType = 0;
                    item.offlineRequest.sortBy = item.offlineRequest.sortBy || 0;
                    item.offlineRequest.itemType = 0;
                    item.offlineRequest.unlockedOnly = false;
                    item.offlineRequest.firstTimeCreation = !!isCreation;
                }
            }
        }

        // All 145 local avatars built into the game's bundlelogic_pc.ipk
        // Starters 379, 382, 383, 385 placed at the beginning
        const localAvatarIds = [
            379, 382, 383, 385,
            23, 33, 51, 52, 67, 72, 73, 77, 78, 80, 90, 97, 99, 115, 118, 127, 131,
            170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183,
            239, 308, 309, 310, 311, 312, 313, 314, 315, 345, 346, 347, 353, 357,
            360, 362, 364, 368, 369, 370, 371, 372, 373, 374, 375, 376, 378, 380,
            381, 387, 388, 389, 478, 479, 480, 481, 498, 499, 500, 504, 505, 506,
            507, 516, 517, 518, 519, 520, 522, 524, 525, 526, 527, 528, 529, 539,
            541, 542, 543, 544, 545, 546, 547, 550, 551, 552, 553, 554, 555, 556,
            557, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571,
            572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 586, 587, 588,
            589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600
        ];

        const explicitItems = localAvatarIds.map(id => ({
            "__class": "Item",
            "act": "ui_component_base",
            "isc": itemIsc,
            "actionList": "SelectAvatarOffline",
            "components": [
                {
                    "__class": "JD_CarouselContentComponent_CustomizableItem",
                    "itemId": id,
                    "itemType": 0
                }
            ]
        }));

        if (avatarsData.categories && avatarsData.categories.length > 0) {
            const starterCategory = avatarsData.categories[0];
            starterCategory.act = catAct;
            starterCategory.isc = catIsc;
            starterCategory.items = [...explicitItems, ...starterCategory.items];
        }

        return avatarsData;
    }

    /**
     * Get skins carousel structure
     * @param {boolean} isCreation - Whether this is for initial dancer profile creation
     * @returns {Object} Carousel content for skins
     */
    getSkinsCarousel(isCreation = false) {
        const localSkinIds = [
            1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23,
            25, 26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
            44, 45, 46, 47, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65,
            67, 68, 69, 70, 71, 72, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86
        ];

        const explicitSkinItems = localSkinIds.map(id => ({
            "__class": "Item",
            "act": "ui_component_base",
            "isc": "skin_creation_item",
            "actionList": "SelectSkinOffline",
            "components": [
                {
                    "__class": "JD_CarouselContentComponent_CustomizableItem",
                    "itemId": id,
                    "itemType": 1
                }
            ]
        }));

        const offlineSkinItem = {
            "__class": "Item",
            "actionList": "SelectSkinOffline",
            "offlineRequest": {
                "__class": "JD_CarouselCustomizableItemRequest",
                "actionListName": "SelectSkinOffline",
                "itemType": 1,
                "jdVersion": 2017,
                "jdversion": 2017,
                "lockType": 0,
                "sortBy": 0,
                "unlockedOnly": false,
                "firstTimeCreation": !!isCreation,
                "uuid": "4c45a707-1b03-4f24-9540-36a43924f469"
            }
        };

        return {
            "__class": "JD_CarouselContent",
            "categories": [
                {
                    "__class": "Category",
                    "title": "Skins",
                    "act": "avatar_carousel",
                    "isc": "avatar_row",
                    "items": [...explicitSkinItems, offlineSkinItem]
                }
            ],
            "actionLists": {
                "SelectSkinOffline": {
                    "__class": "ActionList",
                    "actions": [
                        {
                            "__class": "Action",
                            "bannerType": "dancer",
                            "title": "Select skin",
                            "type": "select-skin"
                        }
                    ],
                    "itemType": "skin"
                }
            }
        };
    }

    /**
     * Handle carousel pages requests for dynamic content (party, sweat, challenges)
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    async handleCarouselPages(req, res) {
        const mode = req.params.mode;
        this.logger.info(`Handling carousel page request for mode: ${mode}`);
        
        if (mode === 'avatars') {
            return res.send(this.getAvatarsCarousel(false));
        }
        if (mode === 'avatars-creation') {
            return res.send(this.getAvatarsCarousel(true));
        }
        if (mode === 'dancerprofile' || mode === 'friend-dancerprofile') {
            return res.send(coreMain.dancerprofile);
        }
        if (mode === 'skins') {
            return res.send(this.getSkinsCarousel(false));
        }
        if (mode === 'skins-creation') {
            return res.send(this.getSkinsCarousel(true));
        }
        if (mode === 'create-playlist') {
            return res.send(coreMain.create_playlist);
        }

        let search = "";
        if (req.body.searchString && req.body.searchString != "") {
            search = req.body.searchString;
        } else if (req.body.searchTags && req.body.searchTags != undefined) {
            search = req.body.searchTags[0];
        }

        // Get profileId for personalization
        const profileId = req.query.profileId || await AccountService.findUserFromTicket(req.header('Authorization'));

        let action = null;
        let isPlaylist = false;

        switch (req.params.mode) {
            case "party":
            case "partycoop":
                action = "partyMap";
                break;
            case "sweat":
                action = "sweatMap";
                break;
            case "create-challenge":
                action = "create-challenge";
                break;
            case "jd2019-playlists":
            case "jd2020-playlists":
            case "jd2021-playlists":
            case "jd2022-playlists":
                isPlaylist = true;
                break;
        }

        if (isPlaylist) {
            return res.json(require('../../lib/playlist').generatePlaylist().playlistcategory);
        }

        if (action != null) {
            return res.send(await CarouselService.generateCarousel(search, action, profileId));
        }
        
        return res.json({});
    }

    /**
     * Handle upsell videos requests
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleUpsellVideos(req, res) {
        res.send(coreMain.upsellvideos);
    }
}

module.exports = new CarouselRouteHandler();
