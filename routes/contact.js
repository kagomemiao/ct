var express = require('express');
var router = express.Router();
var crypto = require('crypto');
/* GET contact page. */

router.all(/\/*/,function(req, res, next){
	req.getConnection(function(err,connection){
    var query = connection.query('SELECT * FROM af_list;',function(err,rows)
    	{
	        if(err)
	          var errornya  = ("Error Selecting : %s ",err );   
	        req.flash('msg_error', errornya);
	        req.list = rows;
	        next();
    	});
  });
});

function saltPass(password, salt){
	var saltPass =  password + ':' +salt;
	var md5 = crypto.createHash('md5');
	return md5.update(saltPass).digest('hex');
}

function loadUser(req, res, next){
	req.assert('username', '用户名不能为空').notEmpty();
	req.assert('password', '请输入密码').notEmpty();
	var errors = req.validationErrors();
	if(!errors){
		v_user = req.param('username');
		v_password = req.param('password');

		var user = {
			st_username:v_user,
		}

		// var md5 = crypto.createHash('md5');
		var pswd = saltPass(v_password, 'user');
		console.log(pswd);
		var select_sql = 'select * from user where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(select_sql, user, function(err,rows)
				{
					if(err){
						var errslt  = ("查询出错 : %s ",err );
						req.flash('msg_error', errslt);
						res.render('contact/afnamelist',
						{
							title:'出现了错误',
							username: req.param('username'),
							data: req.list,
							password:'',
						});
					}else{
						if(rows.length <= 0){
							req.flash('msg_error', '用户不存在');
							console.log(req.list);
							res.render('contact/afnamelist',
							{
								data:req.list,
								username:req.param('username'),
								password:'',
							});
						}else{
							if(rows[0].st_password === pswd){
								req.session.islogin = req.param('username');
								res.locals.islogin = req.session.islogin;
								res.cookie('islogin',res.locals.islogin,{maxAge: 24*60*60*1000});
								req.flash('msg_info', '登陆成功');
								if(rows[0].is_admin === 1){
									req.session.isadmin = rows[0].is_admin;
									res.locals.isadmin = req.session.isadmin;
									res.cookie('isadmin',res.locals.isadmin,{maxAge: 3*60*60*1000});
								}
								res.render('contact/afnamelist',
								{
									title: '登陆成功',
									data: req.list,
									username: req.param('username'),
								});
								// res.redirect('/');
								// req.userName = rows[0].st_username;
								// return req.userName;
							}else{
								req.flash('msg_error', '密码错误');
								console.log(rows[0].st_password);
								res.render('contact/afnamelist',
								{
									title:'密码错误',
									data:req.list,
									username:req.param('username'),
									password:'',
								});
							}
						}
						
					}
					

				});
	     });

	}else{
			errors_detail = "<p>出现了以下错误</p><ul>";
			for (i in errors) 
			{ 
				error = errors[i]; 
				errors_detail += '<li>'+error.msg+'</li>'; 
			} 
			errors_detail += "</ul>"; 
			req.flash('msg_error', errors_detail);
			res.render('contact/afnamelist',
			{
				title:'出错',
				data:req.list,
				username:req.param('username'),
				password:'',
			});
	}
}
router.post('/', loadUser, function(req, res, next){
	res.render('contact/afnamelist',{
		title:'登陆成功',
	});
});
router.post('/aflist/*', loadUser, function(req, res, next){
	res.render('contact/afnamelist',{
		title:'登陆成功',
	});
});
// router.get('/', function(req, res, next) {
// 	if(req.cookies.islogin){
// 		req.session.islogin = req.cookies.islogin;
// 	}
// 	if(req.session.islogin){
// 		res.locals.islogin = req.session.islogin;
// 	}

// 	res.render('contact/list',
// 		{
// 			title:"联系人列表",
// 			data:req.list,
// 			username:res.locals.islogin,
// 		});
// });


router.get('/', function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	res.render('contact/afnamelist',
	{
		title:"联盟列表",
		data:req.list,
		username: res.locals.islogin,
	});
});

router.get('/aflist/(:afid)', function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM contact where af_id='+req.params.afid, function(err,rows)
		{
			if(err)
				var erroraf = ("Error Selecting : %s ",err );
			req.flash('msg_error',erroraf);
			res.render('contact/aflist',{
				title:"联盟所有联系人",
				data:rows,
				afname: req.param( 'afname' ),
				username: res.locals.islogin,
			});
		});
	});
});

router.delete('/delete/(:id)', checkAdmin, function(req, res, next) {
	req.getConnection(function(err,connection){
		var contact = {
			id: req.params.id,
		}
		
		var delete_sql = 'delete from contact where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, contact, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail); 
					res.redirect('/contact');
				}
				else{
					req.flash('msg_info', '成功删除联系人'); 
					res.redirect('/contact');
				}
			});
		});
	});
});
router.get('/edit/(:id)', checkAdmin, function(req,res,next){
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM contact where id='+req.params.id,function(err,rows)
		{
			if(err)
			{
				var errornya  = ("Error Selecting : %s ",err );  
				req.flash('msg_error', errornya); 
				res.redirect('/contact'); 
			}else
			{
				if(rows.length <=0)
				{
					req.flash('msg_error', "找不到联系人!"); 
					res.redirect('/contact');
				}
				else
				{	
					console.log(rows);
					res.render('contact/edit',{title:"编辑联系人",data:rows[0],username: res.locals.islogin,});

				}
			}

		});
	});
});
router.put('/edit/(:id)', checkAdmin, function(req,res,next){
	req.assert('name', '联系人姓名不能为空').notEmpty();
	req.assert('email', '邮件格式有误').notEmpty().withMessage('邮件不能为空').isEmail();
	var errors = req.validationErrors();
	if (!errors) {
		v_name = req.sanitize( 'name' ).escape().trim();
		v_aftitle = req.sanitize( 'aftitle' ).escape().trim();
		v_email = req.sanitize( 'email' ).escape().trim();
		v_address = req.sanitize( 'address' ).escape().trim();
		v_phone = req.sanitize( 'phone' ).escape().trim();
		v_skype = req.sanitize( 'skype' ).escape().trim();

		var contact = {
			name: v_name,
			aftitle: v_aftitle,
			address: v_address,
			email: v_email,
			phone : v_phone,
			skype: v_skype,
		}

		var update_sql = 'update contact SET ? where id = '+req.params.id;
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, contact, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/edit', 
					{ 
						name: req.param('name'), 
						aftitle: req.param('aftitle'),
						address: req.param('address'),
						email: req.param('email'),
						phone: req.param('phone'),
						skype: req.param('skype'),
					});
				}else{
					req.flash('msg_info', '更新联系人资料成功'); 
					res.redirect('/contact');
				}		
			});
		});
	}else{

		console.log(errors);
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/edit', 
		{ 
			id: req.param('id'),
			afname: req.param('afname'),
			name: req.param('name'), 
			aftitle: req.param('aftitle'),
			address: req.param('address'),
			email: req.param('email'),
			phone: req.param('phone'),
			skype: req.param('skype')
		});
	}
});

router.post('/add', checkAuth, function(req, res, next) {
	req.assert('name', '联系人姓名不能为空').notEmpty();
	req.assert('email', '邮件格式有误').notEmpty().withMessage('邮件不能为空').isEmail();
	var errors = req.validationErrors();
	if (!errors) {
		v_afid = req.param('afid');
		v_name = req.sanitize( 'name' ).escape().trim(); 
		v_aftitle = req.sanitize( 'aftitle' ).escape().trim();
		v_email = req.sanitize( 'email' ).escape().trim();
		v_address = req.sanitize( 'address' ).escape().trim();
		v_phone = req.sanitize( 'phone' ).escape().trim();
		v_skype = req.sanitize( 'skype' ).escape().trim();

		var contact = {
			af_id: v_afid,
			name: v_name,
			aftitle: v_aftitle,
			address: v_address,
			email: v_email,
			phone : v_phone,
			skype: v_skype,
		}

		var insert_sql = 'INSERT INTO contact SET ?';
		req.getConnection(function(err,connection){
			var query = connection.query(insert_sql, contact, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Insert : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/add', 
					{ 
						title: '出现了错误',
						name: req.param('name'), 
						aftitle: req.param('aftitle'),
						address: req.param('address'),
						email: req.param('email'),
						phone: req.param('phone'),
						skype: req.param('skype'),
					});
				}else{
					req.flash('msg_info', '成功添加联系人'); 
					res.redirect('/contact');
				}		
			});
		});
	}else{
		req.getConnection(function(err,connection){
			var query = connection.query('select * from af_list',function(err,rows)
			{
				if(err)
					var errslt  = ("Error Selecting : %s ",err );
				req.flash('msg_error', errslt);

				console.log(errors);
				errors_detail = "<p>出现了以下错误</p><ul>";
				for (i in errors) 
				{ 
					error = errors[i]; 
					errors_detail += '<li>'+error.msg+'</li>'; 
				} 
				errors_detail += "</ul>"; 
				req.flash('msg_error', errors_detail);

				var data = rows;
				res.render('contact/add',
					{
						title: '添加联系人出错',
						name: req.param('name'),
						aftitle: req.param('aftitle'),
						email: req.param('email'),
						phone: req.param('phone'),
						skype: req.param('skype'),
						address: req.param('address'),
						data:rows,
					});
			});
	     });

		// res.render('contact/add', 
		// { 
		// 	title: "添加出错",
		// 	// afid: req.params.afid,
		// 	name: req.param('name'), 
		// 	aftitle: req.param('aftitle'),
		// 	address: req.param('address'),
		// 	email: req.param('email'),
		// 	phone: req.param('phone'),
		// 	skype: req.param('skype'),
		// });
		// res.redirect('./add');
	}

});

router.get('/add', checkAuth, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.getConnection(function(err,connection){
		var query = connection.query('select * from af_list',function(err,rows)
		{
			if(err)
				var errslt  = ("Error Selecting : %s ",err );   
			req.flash('msg_error', errslt);
			var data = rows;
			res.render('contact/add',
				{
					title: '添加联系人',
					name: '',
					aftitle: '',
					email: '',
					phone:'',
					skype:'',
					address:'',
					data:rows,
					username: res.locals.islogin,
				});
		});
     });
});

router.delete('/afdelete/(:id)', checkAdmin, function(req, res, next) {
	req.getConnection(function(err,connection){
		var aflist = {
			af_id: req.params.id,
		}
		
		var delete_sql = 'delete from af_list where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, aflist, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail); 
					res.redirect('/contact/afnamelist');
				}
				else{
					req.flash('msg_info', '成功删除联盟'); 
					res.redirect('/contact/afnamelist');
				}
			});
		});
	});
});
router.get('/afedit/(:id)', checkAdmin, function(req,res,next){
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM af_list where af_id='+req.params.id,function(err,rows)
		{
			if(err)
			{
				var errornya  = ("Error Selecting : %s ",err );  
				req.flash('msg_error', errornya); 
				res.redirect('/contact/afnamelist'); 
			}else
			{
				if(rows.length <=0)
				{
					req.flash('msg_error', "该联盟不存在!"); 
					res.redirect('/contact/afnamelist');
				}
				else
				{	
					console.log(rows);
					res.render('contact/afedit',
						{
							title:"编辑联盟",
							data:rows[0],
							username: res.locals.islogin,
						});

				}
			}

		});
	});
});
router.put('/afedit/(:id)', checkAdmin, function(req,res,next){
	req.assert('afname', '联盟名不能为空').notEmpty();
	var errors = req.validationErrors();
	if (!errors) {
		v_afname = req.sanitize( 'afname' ).escape().trim();
		v_afdesc = req.sanitize( 'afdesc' ).escape().trim();

		var contact = {
			af_afname: v_afname,
			af_desc: v_afdesc,
		}

		var update_sql = 'update af_list SET ? where af_id = '+req.params.id;
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, contact, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/afedit', 
					{ 
						title: "出现了错误",
						afname: req.param( 'afname' ),
						afdesc: req.param( 'afdesc' ), 
					});
				}else{
					req.flash('msg_info', '更新联盟资料成功'); 
					res.redirect('/contact/afnamelist');
				}		
			});
		});
	}else{

		console.log(errors);
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/afedit', 
		{ 
			title: '修改出错',
			id: req.param('id'),
			afname: req.param('afname'),
			afdesc: req.param('afdesc'), 
		});
	}
});

router.post('/afadd', checkAuth, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.assert('afname', '联盟名称不能为空').notEmpty();
	var errors = req.validationErrors();
	if (!errors) {

		v_afname = req.sanitize( 'afname' ).escape().trim();
		v_afdesc = req.sanitize( 'afdesc' ).escape().trim(); 

		var list = {
			af_afname: v_afname,
			af_desc: v_afdesc,
		}

		var insert_sql = 'INSERT INTO af_list SET ?';
		req.getConnection(function(err,connection){
			var query = connection.query(insert_sql, list, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Insert : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/afadd', 
					{ 
						afname:req.param('afname'),
						afdesc:req.param('afdesc'),
						username: res.locals.islogin,
					});
				}else{
					req.flash('msg_info', '成功添加联盟'); 
					res.redirect('/contact/afnamelist');
				}		
			});
		});
	}else{

		// console.log(errors);
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/afadd', 
		{ 
			afname:req.param('afname'),
			afdesc:req.param('afdesc'),
			username: res.locals.islogin,
		});
	}

});

router.get('/afadd', checkAuth, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	res.render(	'contact/afadd', 
	{ 
		title: '添加联盟',
		afname: '',
		afdesc: '',
		username: res.locals.islogin,
	});
});

router.get('/adduser', checkAuth, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	res.render(	'contact/adduser', 
	{ 
		title: '添加用户',
		username: '',
		password: '',
		username: res.locals.islogin,
	});
});
router.post('/adduser', checkAuth, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.assert('username', '联系人姓名不能为空').notEmpty();
	req.assert('password', '密码格式有误').notEmpty().len(8,20);
	var errors = req.validationErrors();
	if (!errors) {
		v_username = req.sanitize('username').escape().trim(); ;
		v_password= req.param('password');
		v_auth = req.param('auth');

		// var md5 = crypto.createHash('md5');
		var pswd = saltPass(v_password, 'user');

		var user = {
			st_username: v_username,
			st_password: pswd,
			is_admin: v_auth,
		}

		var insert_sql = 'INSERT INTO user SET ?';
		req.getConnection(function(err,connection){
			var query = connection.query(insert_sql, user, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Insert : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/adduser', 
					{ 
						title: '出现了错误',
						username: req.param('username'), 
						auth: req.param('auth'),
						username: res.locals.islogin,
					});
				}else{
					req.flash('msg_info', '成功添加用户'); 
					res.redirect('./userlist');
				}		
			});
		});
	}else{
		console.log(errors);
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/adduser', 
		{ 
			username:req.param('username'),
			auth:req.param('auth'),
			username: res.locals.islogin,
		});
	}
});

router.get('/userlist', checkAdmin, function(req, res, next) {
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}

	v_username = req.session.islogin;
	var user = {
		st_username: v_username,
	}
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM user where not ?', user, function(err,rows)
		{
			if(err)
				var erroraf = ("Error Selecting : %s ",err );
			req.flash('msg_error',erroraf);
			res.render('contact/userlist',
			{
				title:"用户列表",
				data:rows,
				username: res.locals.islogin,
			});
		});
	});
});

router.delete('/deluser/(:id)', checkAdmin, function(req, res, next) {
	req.getConnection(function(err,connection){
		var user = {
			st_id: req.params.id,
		}
		
		var delete_sql = 'delete from user where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, user, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail); 
					res.redirect('/contact/userlist');
				}
				else{
					req.flash('msg_info', '成功删除用户'); 
					res.redirect('/contact/userlist');
				}
			});
		});
	});
});

router.get('/edituser/(:id)', checkAdmin, function(req,res,next){
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM user where st_id='+req.params.id,function(err,rows)
		{
			if(err)
			{
				var errornya  = ("Error Selecting : %s ",err );  
				req.flash('msg_error', errornya); 
				res.redirect('/userlist'); 
			}else
			{
				if(rows.length <=0)
				{
					req.flash('msg_error', "找不到联系人!"); 
					res.redirect('/userlist');
				}
				else
				{	
					console.log(rows);
					res.render('contact/edituser',{title:"编辑联系人",data:rows[0],username: res.locals.islogin,});

				}
			}

		});
	});
});
router.put('/edituser/(:id)', checkAdmin, function(req,res,next){
	var errors = req.validationErrors();
	if (!errors) {
		v_auth = req.param( 'auth' );

		var user = {
			is_admin: v_auth,
		}

		var update_sql = 'update user SET ? where st_id = '+req.params.id;
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, user, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/edituser', 
					{ 
						username: req.param('st_username'), 
						auth: req.param('auth'),
					});
				}else{
					req.flash('msg_info', '修改权限成功'); 
					res.redirect('/userlist');
				}		
			});
		});
	}else{

		console.log(errors);
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/edituser', 
		{ 
			username: req.param('username'), 
			password: '',
			auth: req.param('auth'),
		});
	}
});
router.get('/editps', checkAuth, function(req,res,next){
	if(req.cookies.islogin){
		req.session.islogin = req.cookies.islogin;
	}
	if(req.session.islogin){
		res.locals.islogin = req.session.islogin;
	}

	// var username = req.session.islogin;
	res.render('contact/editps',
		{
			title:"修改密码",
			// data:rows[0],
			password:'',
			username: req.session.islogin,
		});


	});
router.post('/editps', checkAuth, function(req,res,next){
	req.assert('password', '请输入8-20位密码').notEmpty().withMessage('密码不能为空').len(8,20);
	var username = req.session.islogin;

	var errors = req.validationErrors();
	if (!errors) {
		v_password = req.param('password');

		var pswd = saltPass(v_password,'user');

		var user = {
			st_password: pswd,
		}

		var update_sql = 'update user SET ? where st_username = "'+username+'"';
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, user, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );   
					req.flash('msg_error', errors_detail); 
					res.render('contact/editps', 
					{ 
						username: req.session.islogin, 
					});
				}else{
					req.flash('msg_info', '修改密码成功');
					res.redirect('/');
					// console.log(pswd);
				}		
			});
		});
	}else{
		errors_detail = "<p>出现了以下错误</p><ul>";
		for (i in errors) 
		{ 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 
		req.flash('msg_error', errors_detail); 
		res.render('contact/editps', 
		{ 
			username: req.session.islogin, 
			password: '',
		});
	}
});
router.get('/login', function(req, res){
		if(req.session.islogin){
			res.locals.islogin=req.session.islogin;
		}

		if(req.session.islogin){
			req.session.islogin=req.cookies.islogin;
		}

		res.render('/contact/login',{username: res.locals.islogin});
});

router.get('/logout', function(req, res){
	res.clearCookie('islogin');
	req.session.destroy();
	res.redirect('/');
});
module.exports = router;

function checkAuth(req, res, next) {
  if (!req.session.islogin) {
	res.clearCookie('islogin');
	req.session.destroy();
    res.send('您没有相关权限<br><a href="javascript:history.back()">返回</a>');
  } else {
    next();
  }
}

function checkAdmin(req, res, next) {
  if (!req.session.isadmin) {
	res.clearCookie('isadmin');
	req.session.destroy();
	res.send('您不是管理员<br><a href="javascript:history.back()">返回</a>');
  } else {
    next();
  }
}