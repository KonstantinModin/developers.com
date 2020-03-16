const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate("user", ["name", "avatar"]);

        if (!profile) {
            return res
                .status(400)
                .json({ msg: "There is no profile for this user" });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/profile
// @desc    Create/update users profile
// @access  Private
router.post(
    "/",
    [
        auth,
        [
            check("status", "Status is required")
                .not()
                .isEmpty(),
            check("skills", "Skills is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        // Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) profileFields.skills = skills.split(/\s*,\s*/);

        //Build social object
        profileFields.social = {};
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update if it exists
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                return res.json(profile);
            }
            // If profile not exists -> create it
            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar"
        ]);
        res.json(profiles);
    } catch (error) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);

        if (!profile) return res.status(400).json({ msg: "Profile not found" });
        res.json(profile);
    } catch (error) {
        console.error(error.message, error.kind);
        if (error.kind === "ObjectId") {
            return res.status(400).json({ msg: "Profile not found" });
        }
        res.status(500).send("Server Error");
    }
});

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete("/", auth, async (req, res) => {
    try {
        // @todo - remove users posts

        //remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: "User Removed" });
    } catch (error) {
        console.error(error.message, error.kind);
        if (error.kind === "ObjectId") {
            return res.status(400).json({ msg: "Profile not found" });
        }
        res.status(500).send("Server Error");
    }
});

// @route   PUT api/profile/expirience
// @desc    Add profile expirience
// @access  Private
router.put(
    "/experience",
    [
        auth,
        [
            check("title", "Title is required")
                .not()
                .isEmpty(),
            check("company", "Company is required")
                .not()
                .isEmpty(),
            check("from", "From date is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        console.log(req.body);
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route   DELETE api/profile/expirience/:exp_id
// @desc    Delete expirience from profile
// @access  Private

router.delete("/expirience/:exp_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        const newExpirience = profile.experience.filter(
            item => item.id !== req.params.exp_id
        );
        profile.experience = newExpirience;
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
    "/education",
    [
        auth,
        [
            check("school", "School is required")
                .not()
                .isEmpty(),
            check("degree", "Degree is required")
                .not()
                .isEmpty(),
            check("fieldofstudy", "Field of study is required")
                .not()
                .isEmpty(),
            check("from", "From is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        console.log(req.body);
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education = profile.education.filter(
            item => item.id !== req.params.edu_id
        );

        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public

router.get("/github/:username", (req, res) => {
    try {
        const options = {
            uri: encodeURI(
                `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
            ),
            method: "GET",
            headers: {
                "user-agent": "node.js",
                Authorization: `token ${config.get("gitToken")}`
            }
        };
        // console.log(options);

        request(options, (error, response, body) => {
            // console.log(body);
            // console.log(error);
            // console.log(response.statusCode);

            if (error) console.error(error);

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: "No Github profile found" });
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
