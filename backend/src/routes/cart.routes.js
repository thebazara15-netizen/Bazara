const { verifyToken } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.get("/", verifyToken, authorize(["CLIENT"]), getCart);
router.post("/", verifyToken, authorize(["CLIENT"]), addToCart);
router.put("/:id", verifyToken, authorize(["CLIENT"]), updateCart);
router.delete("/:id", verifyToken, authorize(["CLIENT"]), removeItem);