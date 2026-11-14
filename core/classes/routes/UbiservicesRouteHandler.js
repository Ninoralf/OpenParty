/**
 * Ubiservices Route Handler for OpenParty
 * Handles Ubisoft services related routes
 */
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const RouteHandler = require('./RouteHandler'); // Assuming RouteHandler is in the same directory
const AccountService = require('../../services/AccountService'); // Import AccountService directly

class UbiservicesRouteHandler extends RouteHandler {
    /**
     * Create a new ubiservices route handler
     */
    constructor() {
        super('UbiservicesRouteHandler');

        // Bind handler methods to maintain 'this' context
        this.handleConfiguration = this.handleConfiguration.bind(this);
        this.handleAppConfig = this.handleAppConfig.bind(this);
        this.handleSessions = this.handleSessions.bind(this);
        this.handleDeleteSessions = this.handleDeleteSessions.bind(this);
        this.handleGetProfiles = this.handleGetProfiles.bind(this);
        this.handleGetPopulations = this.handleGetPopulations.bind(this);
        this.handleGetParametersJD22 = this.handleGetParametersJD22.bind(this);
        this.handleGetParametersJD18 = this.handleGetParametersJD18.bind(this);
        this.handlePostUsers = this.handlePostUsers.bind(this);
        this.handleGetSpaceEntities = this.handleGetSpaceEntities.bind(this); // Bind new handler

        // Initialize properties
        this.core = {
            main: require('../../var').main,
            CloneObject: require('../../helper').CloneObject,
            generateCarousel: require('../../carousel/carousel').generateCarousel,
            generateSweatCarousel: require('../../carousel/carousel').generateSweatCarousel,
            generateCoopCarousel: require('../../carousel/carousel').generateCoopCarousel,
            updateMostPlayed: require('../../carousel/carousel').updateMostPlayed,
            signer: require('../../lib/signUrl'),
            ipResolver: require('../../lib/ipResolver'),
        };

        this.settings = require('../../../settings.json');
        this.cachedTicket = {}; // Cache for fake tickets
        this.ipCache = {}; // Cache to store session data based on IP
        this.prodwsurl = "https://public-ubiservices.ubi.com/";
    }

    /**
     * Initialize the routes
     * @param {Express} app - The Express application instance
     */
    initroute(app) {
        console.log(`[ROUTE] ${this.name} initializing routes...`);

        // Serve application configuration
        this.registerGet(app, '/:version/applications/:appId/configuration', this.handleConfiguration);

        // Serve alternative application configuration
        this.registerGet(app, '/:version/applications/:appId', this.handleAppConfig);

        // Handle session creation
        this.registerPost(app, '/v3/profiles/sessions', this.handleSessions);

        // Handle session deletion
        this.registerDelete(app, '/v3/profiles/sessions', this.handleDeleteSessions);

        // spaceID
        this.registerGet(app, '/v2/spaces/:spaceId/entities', this.handleGetSpaceEntities);

        // Retrieve profiles based on query parameters
        this.registerGet(app, '/v3/profiles', this.handleGetProfiles);
        this.registerGet(app, '/v2/profiles', this.handleGetProfiles);
        this.registerGet(app, '/:version/spaces/:spaceId/items', (req, res) => res.send({ items: [] }));
        this.registerGet(app, '/:version/profiles/:profileId/inventory', (req, res) => res.send({ inventory: [] }));

        // Serve population data
        this.registerGet(app, '/v1/profiles/me/populations', this.handleGetPopulations);

        // Serve application parameters for JD22
        this.registerGet(app, '/v1/applications/34ad0f04-b141-4793-bdd4-985a9175e70d/parameters', this.handleGetParametersJD22);

        // Serve application parameters for JD21
        this.registerGet(app, '/v1/applications/c8cfd4b7-91b0-446b-8e3b-7edfa393c946/parameters', this.handleGetParametersJD21);

        // Serve application parameters for JD18
        this.registerGet(app, '/v1/spaces/041c03fa-1735-4ea7-b5fc-c16546d092ca/parameters', this.handleGetParametersJD18);

        // Handle user-related requests (stubbed for now)
        this.registerGet(app, '/v3/policies/:langID', this.handleGetPolicies); // New policies route
        this.registerPost(app, '/v3/users', this.handlePostUsersNew); // New POST /v3/users route
        this.registerPost(app, '/v3/users/:user', this.handlePostUsers);
        this.registerGet(app, '/v3/users/:user', this.handleGetUsers);

        


        console.log(`[ROUTE] ${this.name} routes initialized`);
    }

    /**
     * Handle application configuration request
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleConfiguration(req, res) {
        res.send(this.core.main.configuration);
    }

    /**
     * Handle alternative application configuration request
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleAppConfig(req, res) {
        res.send(this.core.main.configurationnx);
    }

    /**
     * Handle session creation
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    async handleSessions(req, res) {
        const clientIp = this.getClientIp(req);
        const clientIpCountry = this.getCountryFromIp(clientIp);

        // Remove Host header before forwarding to external service
        const headers = { ...req.headers };
        delete headers.host;

        const customAuthData = this.parseCustomAuthHeader(headers.authorization);

        if (customAuthData) {
            console.log("[ACC] CustomAuth detected, verifying...");

            const { profileId, username, email, password } = customAuthData;
            const userData = await AccountService.getUserData(profileId);
            const ticket = `CustomAuth${headers.authorization.split(" t=")[1]}`;
            const defaults = this.getDefaultUserUnlocks();
            const decodedUsername = this.atob(username);

            this.cachedTicket[ticket] = profileId;

            if (userData && userData.password && userData.email && userData.password === password) {
                console.log("[ACC] CustomAuth login: ", decodedUsername);
                const updates = {
                    username: decodedUsername,
                    nickname: decodedUsername,
                    name: decodedUsername,
                    email,
                    password,
                    userId: profileId,
                    ticket: `Ubi_v1 ${ticket}`
                };
                if (!userData.avatar) updates.avatar = defaults.avatar;
                if (!userData.skin) updates.skin = defaults.skin;
                if (!userData.alias) updates.alias = defaults.alias;
                if (!userData.portraitBorder) updates.portraitBorder = defaults.portraitBorder;
                if (!userData.unlockedAvatars || userData.unlockedAvatars.length === 0) {
                    updates.unlockedAvatars = defaults.unlockedAvatars;
                }
                if (!userData.unlockedSkins || userData.unlockedSkins.length === 0) {
                    updates.unlockedSkins = defaults.unlockedSkins;
                }
                if (!userData.unlockedAliases || userData.unlockedAliases.length === 0) {
                    updates.unlockedAliases = defaults.unlockedAliases;
                }
                if (!userData.unlockedPortraitBorders || userData.unlockedPortraitBorders.length === 0) {
                    updates.unlockedPortraitBorders = defaults.unlockedPortraitBorders;
                }
                await AccountService.updateUser(profileId, updates);
                const sessionData = this.generateSessionData(profileId, decodedUsername, clientIp, clientIpCountry, ticket);
                this.ipCache[clientIp] = sessionData;
                res.send(sessionData);
                return;
            } else if (!userData || !userData.password || !userData.email) {
                console.log("[ACC] CustomAuth register: ", decodedUsername);
                await AccountService.updateUser(profileId, {
                    username: decodedUsername,
                    nickname: decodedUsername,
                    name: decodedUsername,
                    email,
                    password,
                    userId: profileId,
                    ticket: `Ubi_v1 ${ticket}`,
                    country: clientIpCountry || 'US',
                    platformId: 'pc',
                    ...defaults
                });
                const sessionData = this.generateSessionData(profileId, decodedUsername, clientIp, clientIpCountry, ticket);
                this.ipCache[clientIp] = sessionData;
                res.send(sessionData);
                return;
            } else {
                console.log("[ACC] CustomAuth login, Invalid Credentials: ", decodedUsername);
            }
        }

        try {
            console.log("[ACC] Fetching Ticket From Official Server");
            const response = await axios.post(`${this.prodwsurl}/v3/profiles/sessions`, req.body, { headers });

            res.send(response.data);
            console.log("[ACC] Using Official Ticket");

            // Update user mappings
            AccountService.addUserId(response.data.profileId, response.data.userId);
            const hashedTicket = crypto.createHash('sha256').update(`Ubi_v1 ${response.data.ticket}`).digest('hex');
            AccountService.updateUserTicket(response.data.profileId, hashedTicket);
        } catch (error) {
            console.log("[ACC] Error fetching from Ubisoft services", error.message);

            if (this.ipCache[clientIp]) {
                const existingSession = this.ipCache[clientIp];
                const existingUser = await AccountService.getUserData(existingSession.profileId);
                if (existingUser) {
                    console.log(`[ACC] Returning cached session for IP ${clientIp}`);
                    return res.send(existingSession);
                }
            }

            const profileId = uuidv4();
            const userTicket = this.generateFalseTicket();
            this.cachedTicket[userTicket] = profileId; // Store fake ticket to profileId mapping

            console.log("[ACC] Generating Fake Session for", profileId);

            const defaults = this.getDefaultUserUnlocks();
            await AccountService.updateUser(profileId, {
                username: "Ninoralf",
                nickname: "Ninoralf",
                name: "Ninoralf",
                userId: profileId,
                ticket: `Ubi_v1 ${userTicket}`,
                country: clientIpCountry || 'US',
                platformId: 'pc',
                ...defaults
            });

            const fakeSession = this.generateSessionData(profileId, "Ninoralf", clientIp, clientIpCountry, userTicket);
            this.ipCache[clientIp] = fakeSession; // Cache the fake session for this IP

            res.send(fakeSession);
        }
    }

    /**
     * Handle session deletion
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleDeleteSessions(req, res) {
        res.send(); // No specific action needed for deletion in this stub
    }

    /**
     * Retrieve profiles based on query parameters
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    async handleGetProfiles(req, res) {
        const authHeader = req.header('Authorization');
        let profileIdFromTicket = null;
        if (authHeader) {
            const rawTicket = authHeader.startsWith('Ubi_v1 ') ? authHeader.substring(7) : authHeader;
            profileIdFromTicket = this.cachedTicket[rawTicket] || this.cachedTicket[authHeader] || null;
            if (!profileIdFromTicket) {
                profileIdFromTicket = await AccountService.findUserFromTicket(authHeader);
            }
        }
        const clientIp = this.getClientIp(req);
        if (!profileIdFromTicket && this.ipCache[clientIp]) {
            profileIdFromTicket = this.ipCache[clientIp].profileId;
        }

        const profileIdsParam = req.query.profileIds || req.query.userIds;
        let ids = [];
        if (profileIdsParam) {
            ids = profileIdsParam.split(',');
        } else if (req.query.idOnPlatform) {
            ids = [req.query.idOnPlatform];
        } else if (profileIdFromTicket) {
            ids = [profileIdFromTicket];
        } else {
            const allAccounts = await AccountService.getAllAccounts();
            const keys = Object.keys(allAccounts);
            if (keys.length > 0) ids = [keys[0]];
            else ids = [uuidv4()];
        }

        const profiles = [];
        for (const id of ids) {
            const user = await AccountService.getUserData(id);
            const name = user ? (user.name || user.nickname || user.username || "Ninoralf") : "Ninoralf";
            profiles.push({
                profileId: id,
                userId: id,
                platformType: "uplay",
                idOnPlatform: id,
                nameOnPlatform: name
            });
        }

        res.send({ profiles });
    }

    /**
     * Serve population data
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetPopulations(req, res) {
        const spaceId = req.query.spaceIds || uuidv4();
        res.send({
            spaceId,
            data: {
                US_SDK_APPLICATION_BUILD_ID: "202007232022",
                US_SDK_DURABLES: []
            }
        });
    }

    /**
     * Serve application parameters for JD22
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetParametersJD22(req, res) {
    res.send(this.replaceDomainPlaceholder(require("../../database/config/v1/parameters.json"), this.settings.server.domain));
    }

    /**
     * Serve application parameters for JD18
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    /**
     * Serve application parameters for JD21
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetParametersJD21(req, res) {
        res.send(this.replaceDomainPlaceholder(require("../../database/config/v1/jd21/parameters.json"), this.settings.server.domain));
    }

    /**
     * Serve application parameters for JD18
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetParametersJD18(req, res) {
        res.send(this.replaceDomainPlaceholder(require("../../database/config/v1/parameters2.json"), this.settings.server.domain));
    }

    /**
     * Handle user-related requests (stubbed for now)
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    /**
     * Handle GET /v3/policies/:langID
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetPolicies(req, res) {
        res.send({
            "termOfSaleContent": "",
            "policyAcceptance": "I accept Ubisoft's Terms of Use, Terms of Sale and Privacy Policy.",
            "policyAcceptanceIsRequired": true,
            "policyAcceptanceDefaultValue": false,
            "policyLocaleCode": "en-US",
            "minorAccount": {
              "ageRequired": 7,
              "isDigitalSignatureRequiredForAccountCreation": true,
              "privacyPolicyContent": "Basically We Need Ur Ticket and IP for assigning cracked user only. We dont care about your data."
            },
            "adultAccount": {
              "ageRequired": 18
            },
            "legalOptinsKey": "eyJ2dG91IjoiNC4wIiwidnBwIjoiNC4xIiwidnRvcyI6IjIuMSIsImx0b3UiOiJlbi1VUyIsImxwcCI6ImVuLVVTIiwibHRvcyI6ImVuLVVTIn0",
            "ageRequired": 13,
            "communicationOptInDefaultValue": true,
            "privacyPolicyContent": "Who Need Those",
            "termOfUseContent": "Who Need Those"
          });
    }

    /**
     * Handle POST /v3/users
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handlePostUsersNew(req, res) {
        res.send({
            country: 'US',
            ageGroup: 'Adult',
            email: 'MFADAMO_JD2016@ubisoft.com',
            legalOptinsKey: 'eyJ2dG91IjoiNC4wIiwidnBwIjoiNC4xIiwidnRvcyI6IjIuMSIsImx0b3UiOiJlbi1VUyIsImxwcCI6ImVuLVVTIiwibHRvcyI6ImVuLVVTIn0',       
            password: '#JD2016ubi42',
            gender: 'NOT_DEFINED',
            preferredLanguage: 'FR',
            nameOnPlatform: 'MFADAMO_J_JD2016',
            accountType: 'Ubisoft',
            profileId: "f7d85441-265d-4c9c-b1e3-25af3182091a",
            userId: "4f7fc740-da32-4f2d-a81e-18faf7a1262d"
          });
    }

    /**
     * Handle user-related requests (stubbed for now)
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handlePostUsers(req, res) {
        res.send(); // No specific action needed for this stubbed endpoint
    }

    /**
     * Handle user-related requests (stubbed for now)
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetUsers(req, res) {
        res.send(); // No specific action needed for this stubbed endpoint
    }

    /**
     * Handle GET requests for space entities.
     * @param {Request} req - The request object
     * @param {Response} res - The response object
     */
    handleGetSpaceEntities(req, res) {
        res.send(this.core.main.entities);
    }

    /**
     * Replace domain placeholders in an object
     * @param {Object|Array|string} obj - The object to process
     * @param {string} domain - The domain to replace with
     * @returns {Object|Array|string} The processed object
     * @private
     */
    replaceDomainPlaceholder(obj, domain) {
        if (typeof obj === 'string') {
            return obj.replace('{SettingServerDomainVarOJDP}', domain);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceDomainPlaceholder(item, domain));
        } else if (obj && typeof obj === 'object') {
            return Object.keys(obj).reduce((acc, key) => {
                acc[key] = this.replaceDomainPlaceholder(obj[key], domain);
                return acc;
            }, {});
        }
        return obj;
    }

    /**
     * Get client IP from request
     * @param {Request} req - The request object
     * @returns {string} Client IP address
     * @private
     */
    getClientIp(req) {
        return this.core.ipResolver.getClientIp(req);
    }

    /**
     * Get country from IP address
     * @param {string} ip - IP address
     * @returns {string} Country code
     * @private
     */
    getCountryFromIp(ip) {
        // Placeholder function - in a real app, you'd use a geolocation service
        return 'US';
    }

    /**
     * Generate a fake ticket for fallback
     * @returns {string} Fake ticket
     * @private
     */
    generateFalseTicket() {
        const start = "ew0KIC";
        const end = "KfQ==";
        const middleLength = 60;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let middle = '';

        for (let i = 0; i < middleLength; i++) {
            middle += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return start + middle + end;
    }

    /**
     * Parse custom authorization header
     * @param {string} authorization - Authorization header
     * @returns {Object|null} Parsed authorization data or null if invalid
     * @private
     */
    parseCustomAuthHeader(authorization) {
        if (!authorization) return null; // Handle undefined or null authorization header

        const [method, encoded] = authorization.split(" ");
        if (method !== "uplaypc_v1" || !encoded || !encoded.includes("t=")) {
            return null;
        }

        // Get the part after the first "t="
        const encodedPart = encoded.substring(encoded.indexOf("t=") + 2);

        // Decode Base64 after "t="
        let decoded;
        try {
            decoded = this.atob(encodedPart);
        } catch (e) {
            console.error("Error decoding custom auth header:", e);
            return null;
        }

        const parts = decoded ? decoded.split(":") : [];
        if (parts.length >= 6 && parts[0] === "JDParty") {
            const [tag, encodedProfileId, profileId, username, email, encodedPassword] = parts;
            return {
                profileId,
                username,
                email,
                password: this.atob(encodedPassword),
            };
        }

        // Support fallback UUID tickets (e.g. Guest ticket)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(decoded) || uuidRegex.test(encodedPart)) {
            const guestUuid = uuidRegex.test(decoded) ? decoded : encodedPart;
            return {
                profileId: guestUuid,
                username: Buffer.from("Ninoralf").toString("base64"),
                email: "user332630@jdparty.xyz",
                password: "password",
            };
        }

        return null;
    }

    /**
     * Decode Base64 string
     * @param {string} base64 - Base64 encoded string
     * @returns {string} Decoded string
     * @private
     */
    atob(base64) {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    /**
     * Generate session data
     * @param {string} profileId - Profile ID
     * @param {string} username - Username
     * @param {string} clientIp - Client IP address
     * @param {string} clientIpCountry - Client country
     * @param {string} ticket - Session ticket
     * @returns {Object} Session data
     * @private
     */
    generateSessionData(profileId, username, clientIp, clientIpCountry, ticket) {
        const now = new Date();
        const expiration = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours as in original

        return {
            platformType: "uplay",
            ticket,
            twoFactorAuthenticationTicket: null,
            profileId,
            userId: profileId,
            nameOnPlatform: username,
            environment: "Prod",
            expiration: expiration.toISOString(),
            spaceId: uuidv4(), // Original had uuidv4 here, refactored had it missing
            clientIp,
            clientIpCountry,
            serverTime: now.toISOString(),
            sessionId: uuidv4(),
            sessionKey: "TqCz5+J0w9e8qpLp/PLr9BCfAc30hKlEJbN0Xr+mbZa=", // Fixed string as in original
            rememberMeTicket: null,
        };
    }

    /**
     * Get default unlock items for newly created users
     * @returns {Object} Default items and unlock arrays
     * @private
     */
    getDefaultUserUnlocks() {
        try {
            const items = this.core.main.items || {};
            const aliases = this.core.main.aliases || {};
            
            const avatarIds = items.avatars 
                ? Object.keys(items.avatars).map(Number).filter(n => !isNaN(n))
                : [1, 2, 3, 4, 5, 512];
            const skinIds = items.skins 
                ? Object.keys(items.skins).map(Number).filter(n => !isNaN(n))
                : [1];
            const portraitBorderIds = items.portraitBorders 
                ? Object.keys(items.portraitBorders).map(Number).filter(n => !isNaN(n))
                : [1];
            const aliasIds = aliases.aliases 
                ? Object.keys(aliases.aliases).map(Number).filter(n => !isNaN(n))
                : [1];

            return {
                avatar: 512,
                skin: 1,
                alias: 1,
                portraitBorder: 1,
                unlockedAvatars: avatarIds,
                unlockedSkins: skinIds,
                unlockedPortraitBorders: portraitBorderIds,
                unlockedAliases: aliasIds
            };
        } catch (e) {
            return {
                avatar: 512,
                skin: 1,
                alias: 1,
                portraitBorder: 1,
                unlockedAvatars: [1, 2, 3, 4, 5, 512],
                unlockedSkins: [1],
                unlockedPortraitBorders: [1],
                unlockedAliases: [1]
            };
        }
    }
}

// Export an instance of the route handler
module.exports = new UbiservicesRouteHandler();