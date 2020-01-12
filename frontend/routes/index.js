var express = require('express');
var router = express.Router();
var User = require('../models/user');
//var multer  =   require('multer');
//var path = require('path')
var fs = require('fs');
var NATS = require('nats');

const servers = ['nats://192.168.0.145:4222']
const nc = NATS.connect({ servers: servers, json: true })

var lastResult ='';

nc.on('error', (e) => {
  console.log('Error [' + nc.currentServer + ']: ' + e)
  process.exit()
})

nc.on('connect', () => {
  const opts = {}
  const queue = ''
  if (queue) {
    opts.queue = queue
  }
  let subject = "num_plate";
  nc.subscribe(subject, opts, (msg) => {
    console.log('Received "' + JSON.stringify(msg) + '"')
    lastResult = msg['plate']
  })
  if (queue) {
    console.log('Queue [' + queue + '] listening on [' + subject + ']')
  } else {
    console.log('Listening on [' + subject + ']')
  }
})

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};

// route for user signup
router.get('/signup', sessionChecker, (req, res) => {
        res.sendFile('/view/signup.html', {root: './'});
    })
router.post('/signup', (req, res) => {
        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.redirect('/dashboard');
        })
        .catch(error => {
            res.redirect('/signup');
        });
    });


// route for user Login
router.get('/login', sessionChecker, (req, res) => {
        res.sendFile('/view/login.html', {root: './'});
    })
router.post('/login', (req, res) => {
        var username = req.body.username,
            password = req.body.password;

        User.findOne({ where: { username: username } }).then(function (user) {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            }
        });
    });


// route for user's dashboard
router.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile('/view/dashboard.html', {root: './' });
    } else {
        res.redirect('/login');
    }
});


// route for user logout
router.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// route for Home-Page
router.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

router.post('/api/captures', function (req, res) {
  var base64Data = req.body.imgBase64;
  const subject = 'captures';
  var msg = {
    "file": base64Data,
    "jobno": "1"
  };
  nc.publish(subject, msg, () => {
    //console.log('Published [' + subject + '] : "' + JSON.stringify(msg) + '"')
  })
  res.send("success");
});

router.get('/lastResult', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.send(lastResult);
	lastResult = '';
    } else {
        res.redirect('/login');
    }
});

/*

router.post('/api/captures', function (req, res) {
  //var base64Data = req.body.imgBase64.replace(/^data:image\/png;base64,/, "");
  var base64Data = req.body.imgBase64;
  var path = "." + "/uploads/captures/" + req.body.fileName;
  fs.writeFile(path, base64Data, "base64", function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send("success");
    }
  });
});

*/
/*
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    //callback(null, file.fieldname + '-' + Date.now());
    callback(null, 'sudi' + '-' + Date.now());
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

router.post('/api/photo',function(req,res){
    console.log('sudi');
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
    });
    console.log('sudi-ends');
});

const handleError = (err, res) => {
	  res
	    .status(500)
	    .contentType("text/plain")
	    .end("Oops! Something went wrong!");
};


const upload = multer({
  dest: "/home/pi/projects/sudeepto/picam/frontend/uploads/files"
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

router.post(
  "/api/photo",
  upload.single("file"),
  (req, res) => {
    const tempPath = req.file.path;
    //const targetPath = path.join(__dirname, "../uploads/", Date.now() + '-' + req.file.originalname);
    const targetPath = path.join(__dirname, "../uploads/", Date.now() + '.png');
    console.log ("upload loc", targetPath, " temp path = ", tempPath);
    //console.log (" req = ", req);

    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
      fs.rename(tempPath, targetPath, err => {
        if (err) return handleError(err, res);

        res
          .status(200)
          .contentType("text/plain")
          .end("File uploaded!");
      });
    } else {
      fs.unlink(tempPath, err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
  }
);
*/
module.exports = router;
