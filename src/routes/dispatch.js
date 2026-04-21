const express = require('express');
const router = express.Router();

/**
 * @route POST /v1/dispatch
 * @description Dispatch endpoint for game server information
 * @access Public
 */
router.post('/v1/dispatch', (req, res) => {
    const response = {
        code: 1,
        message: "success",
        data: {
            gaddr: "83.168.95.27:49842",
            name: "gyt3lyz",
            mid: "m1046_2",
            mname: "m1046_2",
            downurl: "http://10.118.13.248:38199/GameAssets/Maps/g1046/m1046_2.zip",
            region: 8008,
            resVersion: 10068,
            requestIds: {
                "112": "windows_disp_request_id"
            },
            gameType: "g1046",
            cdns: [{
                cdnId: "1",
                cdnName: "",
                cdnUrl: "http://10.118.13.248:38199",
                url: "http://10.118.13.248:38199/GameAssets/Maps/g1046/m1046_2.zip",
                ratio: 1,
                base: true
            }],
            retry: false
        }
    };
    
    res.json(response);
});

module.exports = router;
