import express from "express";
// import authRoutes from "./auth.routes";
// import profileRoutes from "./profile.routes";
// import listingRoutes from "./listing.routes";
// import bookingRoutes from "./booking.routes";
// import messageRoutes from "./message.routes";
// import cohostRoutes from "./cohost.routes";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Welcome to API v1" });
});

// router.use("/auth", authRoutes);
// router.use("/profiles", profileRoutes);
// router.use("/listings", listingRoutes);
// router.use("/bookings", bookingRoutes);
// router.use("/messages", messageRoutes);
// router.use("/cohosts", cohostRoutes);

export default router;
