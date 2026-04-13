const { verifyToken } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.post("/", verifyToken, authorize(["CLIENT"]), placeOrder);
router.get("/", verifyToken, authorize(["CLIENT"]), getOrders);