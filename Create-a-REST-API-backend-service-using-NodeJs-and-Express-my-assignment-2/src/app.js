const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator')
const userModel = require('./models/user')
const postModel = require('./models/post')
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const secret = "RESTAPI"

app.use(bodyParser.json())
app.use('/posts', (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split("test")[1];
        try {
            jwt.verify(token, secret, async function (err, decoded) {
                if (err) {
                    res.status(400).json(err.message)
                }
                const user = await userModel.findOne({ _id: decoded.data })
                req.user = user._id;
                next();
            });
        }
        catch (e) {
            res.status(400).json(e.message)
        }
    }
    else {
        res.status(400).json({ message: "user invalid" })
    }
})

app.get('/allUsers', async (req, res) => {
    try {
        const results = await userModel.find();
        res.status(200).json(results);
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})
app.get('/posts', async (req, res) => {
    try {
        const posts = await postModel.find({ user: req.user });
        res.status(200).json(posts);
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})

app.post('/register', body('email').isEmail(), body('password').isLength({ min: 5 }), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const data = new userModel(req.body);
        data.password = await bcrypt.hash(data.password, 10)
        await data.save();
        res.status(200).json({ status: "success", data });
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})
app.post('/posts', async (req, res) => {
    try {
        const posts = await postModel.create({
            title: req.body.title,
            body: req.body.body,
            image: req.body.image,
            user: req.user
        })
        res.status(200).json({
            message: "success",
            posts
        })
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})
app.put('/posts/:postId', async (req, res) => {
    try {
        await postModel.findByIdAndUpdate(req.params.postId, req.body)
        const posts = await postModel.findById(req.params.postId)
        res.status(200).json({
            message: "success",
            posts
        })
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})
app.delete('/posts/:postId', async (req, res) => {
    try {
        const posts = await postModel.findById(req.params.postId)
        await postModel.findByIdAndDelete(req.params.postId, req.body)
        res.status(200).json({
            message: "success",
            posts
        })
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})
app.post('/login', async (req, res) => {
    try {
        const checkUser = await userModel.findOne({ email: req.body.email });
        if (checkUser) {
            bcrypt.compare(req.body.password, checkUser.password, function (err, result) {
                // result == true
                if (result) {
                    const token = "test" + jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60),
                        data: checkUser._id
                    }, secret);
                    res.status(200).json({ status: "success", token });
                }
                else {
                    res.status(400).json({ status: "Wrong Password" });
                }
            });
        }
        else {
            res.status(400).json({ status: "Email not found" });
        }
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
})


module.exports = app;