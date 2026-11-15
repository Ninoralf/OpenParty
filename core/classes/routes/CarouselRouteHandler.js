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
            case 'avatars-creation':
                res.send(this.getAvatarsCarousel());
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
            case 'skins-creation':
                res.send(this.getSkinsCarousel());
                break;
            default:
                res.status(404).send('Not found');
        }
    }

    /**
     * Get avatars carousel structure with explicit items and normalized offlineRequest
     * @returns {Object} Carousel content for avatars
     */
    getAvatarsCarousel() {
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

        for (const cat of (avatarsData.categories || [])) {
            for (const item of (cat.items || [])) {
                if (item.offlineRequest) {
                    const ver = item.offlineRequest.jdVersion || item.offlineRequest.jdversion || 2017;
                    item.offlineRequest.jdversion = ver;
                    item.offlineRequest.jdVersion = ver;
                    item.offlineRequest.lockType = 0;
                    item.offlineRequest.sortBy = item.offlineRequest.sortBy || 0;
                    item.offlineRequest.itemType = 0;
                    item.offlineRequest.unlockedOnly = false;
                    item.actionList = "SelectAvatarOffline";
                }
            }
        }

        if (avatarsData.categories && avatarsData.categories.length > 0) {
            const starterCategory = avatarsData.categories[0];
            const starterIds = [512, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
            const explicitItems = starterIds.map(id => ({
                "__class": "Item",
                "act": "ui_component_base",
                "isc": "grp_row",
                "actionList": "SelectAvatarOffline",
                "components": [
                    {
                        "__class": "JD_CarouselContentComponent_CustomizableItem",
                        "itemId": id,
                        "itemType": 0
                    }
                ]
            }));
            starterCategory.items = [...explicitItems, ...starterCategory.items];
        }

        return avatarsData;
    }

    /**
     * Get skins carousel structure
     * @returns {Object} Carousel content for skins
     */
    getSkinsCarousel() {
        return {
            "__class": "JD_CarouselContent",
            "categories": [
                {
                    "__class": "Category",
                    "title": "Skins",
                    "act": "ui_carousel",
                    "isc": "grp_row",
                    "items": [
                        {
                            "__class": "Item",
                            "actionList": "SelectSkinOffline",
                            "offlineRequest": {
                                "__class": "JD_CarouselCustomizableItemRequest",
                                "itemType": 1,
                                "jdVersion": 2017,
                                "jdversion": 2017,
                                "lockType": 0,
                                "sortBy": 0,
                                "unlockedOnly": false,
                                "uuid": "4c45a707-1b03-4f24-9540-36a43924f469"
                            }
                        }
                    ]
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
        
        if (mode === 'avatars' || mode === 'avatars-creation') {
            return res.send(this.getAvatarsCarousel());
        }
        if (mode === 'dancerprofile' || mode === 'friend-dancerprofile') {
            return res.send(coreMain.dancerprofile);
        }
        if (mode === 'skins' || mode === 'skins-creation') {
            return res.send(this.getSkinsCarousel());
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
