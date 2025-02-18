import express from "express";
import bodyParser from "body-parser";
import * as driver from "../controllers/driver_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

router.put('/driver', driver.createPut)

router.post('/driver/token', driver.createTokenPost)

router.use('/driver/verify', auth.driverAuth)

router.get('/driver/verify', driver.testToken)

//router.put('/parkingOwner', (req, res) => {
//    // Create a parking owner
//})

export default router;
