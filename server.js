const mongoclient = require("mongodb").MongoClient;
const ObjId = require('mongodb').ObjectId;
const url =
  'mongodb+srv://admin:1234@cluster0.hbtrfni.mongodb.net/?retryWrites=true&w=majority';
let mydb;
const express = require("express");
const app = express();
const sha = require('sha256');

let cookieParser = require('cookie-parser');
app.use(cookieParser('ak3jkl2jldjlk12'));
app.get('/cookie', (req, res) => {
  res.cookie('milk', '1000원', { signed: true });
  res.send('product: ' + req.signedCookies.milk);
});

let session = require('express-session');
app.use(session({
  secret: '123jklsdkjf23',
  resave: false,
  saveUninitialized: true,
}));

let multer = require('multer');

let imagepath = '';

let storage = multer.diskStorage({
  destination: function (req, file, done) {
    done(null, './public/image')
  },
  filename: function (req, file, done) {
    done(null, file.originalname)
  }
})

let upload = multer({ storage: storage });

app.get('/session', (req, res) => {
  if (isNaN(req.session.milk)) {
    req.session.milk = 0;
  }
  req.session.milk = req.session.milk + 1000;
  res.send('session: ' + req.session.milk + '원');
});

app.use(express.static('public'));
//body-parser 라이브러리 추가
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get("/", function (req, res) {
  res.render('index.ejs', { user: null });
});

app.get("/listmongo", function (req, res) {
  mydb.collection('post').find().toArray().then(result => {
    console.log(result);
    res.render('list_mongo.ejs', { data: result });
  });
});

app.get('/enter', function (req, res) {
  res.sendFile(__dirname + '/enter.html');
});

app.get('/entermongo', function (req, res) {
  if (req.session.user) {
    console.log('세션 유지')
    res.render('enter.ejs');
  } else {
    res.render('login.ejs');
  }
});

app.get('/signup', function (req, res) {
  res.render('signup.ejs');
});

app.get('/login', function (req, res) {
  console.log(req.session);
  if (req.session.user) {
    console.log('세션 유지');
    res.render('index.ejs', { user: req.session.user });
  } else {
    res.render('login.ejs');
  }
});

app.get('/logout', function (req, res) {
  console.log('로그아웃');
  req.session.destroy();
  res.render('index.ejs', { user: null });
});

app.get("/content/:id", function (req, res) {
  console.log(req.params.id);
  let new_id = new ObjId(req.params.id);

  mydb.collection('post').findOne({ _id: new_id })
    .then(result => {
      console.log(result);
      res.render('content.ejs', { data: result });
    }).catch(err => {
      console.log(err);
      res.status(500).send();
    });
});

app.get("/edit/:id", function (req, res) {
  console.log(req.params.id);
  let new_id = new ObjId(req.params.id);

  mydb.collection('post').findOne({ _id: new_id })
    .then(result => {
      console.log(result);
      res.render('edit.ejs', { data: result });
    }).catch(err => {
      console.log(err);
      res.status(500).send();
    });
});

app.get("/addfriend", function (req, res) {
  if (req.session.user) {
    res.render('add_friend.ejs');
  } else {
    res.render('login.ejs');
  }
});

app.post("/addfriend", function (req, res) {
  const userId = req.session.user.userid;
  const friendId = req.body.friendid;

  mydb.collection('users').updateOne(
    { userid: userId },
    { $addToSet: { friends: friendId } },
    function (err, result) {
      if (err) {
        console.log(err);
        res.status(500).send("친구 추가 중 오류가 발생했습니다.");
      } else {
        console.log(result);
        res.redirect('/friendlist');
      }
    }
  );
});

app.get("/friendlist", function (req, res) {
  if (req.session.user) {
    const userId = req.session.user.userid;

    mydb.collection('users').findOne({ userid: userId })
      .then(result => {
        if (result && result.friends) {
          res.render('friend_list.ejs', { friends: result.friends });
        } else {
          res.render('friend_list.ejs', { friends: [] });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send();
      });
  } else {
    res.render('login.ejs');
  }
});
app.post("/login", function (req, res) {
  mydb.collection('account').findOne({ userid: req.body.userid })
    .then(result => {
      if (result.userpw == sha(req.body.userpw)) {
        req.session.user = req.body;
        console.log('새로운 로그인');
        res.render('index.ejs', { user: req.session.user });
      } else {
        res.render('login.ejs');
      }
    });
});

app.post('/save', function (req, res) {
  console.log(req.body.title);
  console.log(req.body.content);
  console.log(req.body.someDate);

  mydb.collection('post').insertOne({
    userid: req.session.user.userid,
    title: req.body.title,
    content: req.body.content,
    date: req.body.someDate,
    path: imagepath
  }).then(result => {
    console.log(result);
    console.log('데이터 추가 성공');
  });
  res.send('데이터 추가 성공');
});

app.post('/savemongo', function (req, res) {
  console.log(req.session.user);

  console.log(req.body.title);
  console.log(req.body.content);
  let now = new Date();
  mydb.collection('post').insertOne(
    {
      userid: req.session.user.userid,
      title: req.body.title,
      content: req.body.content,
      date: req.body.someDate,
      path: imagepath
    })
    .then(result => {
      console.log(result);
      console.log('데이터 추가 성공');
    });
  res.redirect('/listmongo');
});

app.post('/signup', function (req, res) {
  console.log(req.body);

  mydb.collection('account').insertOne(
    {
      userid: req.body.userid,
      userpw: sha(req.body.userpw),
      usergroup: req.body.usergroup,
      useremail: req.body.email
    })
    .then(result => {
      console.log(result);
      console.log('회원가입 성공');
    });
  res.redirect('/');
});

app.post("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = new ObjId(req.body._id);
  mydb.collection('post').deleteOne(req.body)
    .then(result => {
      console.log('삭제완료');
      res.status(200).send();
    })
    .catch(err => {
      console.log(err);
      res.status(500).send();
    });
});

app.post('/edit', function (req, res) {
  console.log(req.body.title);
  console.log(req.body.content);
  let new_id = new ObjId(req.body.id);
  mydb.collection('post').updateOne({ _id: new_id },
    { $set: { title: req.body.title, content: req.body.content, date: req.body.someDate } })
    .then(result => {
      console.log('데이터 수정 성공');
      res.redirect('/listmongo');
    });
});

app.post('/photo', upload.single('picture'), function (req, res) {
  console.log(req.file.path);
  imagepath = '/' + req.file.path.replace(/\\/g, '/').slice('/public'.length);
});

mongoclient
  .connect(url)
  .then((client) => {

    mydb = client.db('myboard');

    app.listen(8080, function () {
      console.log("포트 8080으로 서버 대기중 ... ");
    });
  })
  .catch((err) => {
    console.log(err);
  });
