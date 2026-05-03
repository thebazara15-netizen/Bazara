const { verifyToken } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");



router.get("/users", verifyToken, authorize(["ADMIN"]), getUsers);
router.get("/orders", verifyToken, authorize(["ADMIN"]), getOrders);
router.put("/approve/:id", verifyToken, authorize(["ADMIN"]), approveVendor);