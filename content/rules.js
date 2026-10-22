/* 字段识别规则库：网申表单里各种叫法 -> 简历数据里的哪个字段
 * 规则从上到下匹配，越具体的写在越前面。
 */
(function () {
  const TT = (window.__TT__ = window.__TT__ || {});

  TT.LISTS = {
    edu: 'educations',
    intern: 'internships',
    project: 'projects',
    campus: 'campus',
    award: 'awards',
    cert: 'certs',
    family: 'family',
    training: 'trainings',
    skill: 'skills',
  };

  // 允许忽略的字段（验证码、密码、搜索框等），命中后不再参与填写
  TT.SKIP = /验证码|校验码|短信码|动态码|密码|password|搜索|search|图形码|captcha|短信验证|旧密码|新密码/;

  /* 选项反推：标签没认出来、或标签对应的值在选项里找不到时，
     用「下拉里有哪些选项」反推这个下拉到底该填什么。
     例如「证件类型 + 证件号码」挤在同一行时，只读下拉会被认成证件号码，
     但它的选项是「身份证/护照/港澳通行证」，据此可以纠正为证件类型。 */
  TT.ENUMS = [
    { type: 'basic', field: 'idType', opts: ['身份证', '居民身份证', '护照', '港澳通行证', '台湾通行证', '军官证', '士兵证', '台胞证', '户口簿', '出生证明', '其他'] },
    { type: 'basic', field: 'gender', opts: ['男', '女', '男性', '女性', '保密', '未知'] },
    { type: 'basic', field: 'nation', opts: ['汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '布依族', '朝鲜族', '满族', '侗族', '瑶族', '白族', '土家族', '哈尼族', '哈萨克族', '傣族', '黎族', '傈僳族', '佤族', '畲族', '高山族', '拉祜族', '水族', '东乡族', '纳西族', '景颇族', '柯尔克孜族', '土族', '达斡尔族', '仫佬族', '羌族', '布朗族', '撒拉族', '毛南族', '仡佬族', '锡伯族', '阿昌族', '普米族', '塔吉克族', '怒族', '乌孜别克族', '俄罗斯族', '鄂温克族', '德昂族', '保安族', '裕固族', '京族', '塔塔尔族', '独龙族', '鄂伦春族', '赫哲族', '门巴族', '珞巴族', '基诺族'] },
    { type: 'basic', field: 'politics', opts: ['中共党员', '中共预备党员', '共青团员', '群众', '民主党派', '无党派人士', '其他'] },
    { type: 'basic', field: 'marriage', opts: ['未婚', '已婚', '离异', '丧偶', '保密'] },
    { type: 'basic', field: 'graduateType', opts: ['应届', '往届', '应届毕业生', '往届生', '在校生', '毕业生'] },
    { type: 'basic', field: 'bloodType', opts: ['A型', 'B型', 'AB型', 'O型', 'A', 'B', 'AB', 'O', 'RH阴性', '不明', '其他'] },
    { type: 'edu', field: 'education', opts: ['博士研究生', '硕士研究生', '本科', '大学本科', '大专', '专科', '高中', '中专', '初中', '小学', '其他'] },
    { type: 'edu', field: 'degree', opts: ['博士', '硕士', '学士', '双学士', '无学位', '其他'] },
    { type: 'edu', field: 'studyForm', opts: ['全日制', '非全日制', '自考', '函授', '业余', '网络教育', '脱产', '在职'] },
    { type: 'skill', field: 'level', opts: ['精通', '熟练', '良好', '一般', '了解', '入门'] },
  ];

  TT.RULES = [
    { re: /证明人(联系方式|电话|手机)/, type: 'edu', field: 'supervisorPhone', section: /教育|学习/ },
    { re: /证明人关系/, type: 'edu', field: 'supervisorRelation', section: /教育|学习/ },
    { re: /证明人(职务|职位)/, type: 'edu', field: 'supervisorTitle', section: /教育|学习/ },
    { re: /^证明人(姓名|名字)?$/, type: 'edu', field: 'supervisor', section: /教育|学习/ },
    { re: /辅导员(联系方式|电话|手机)/, type: 'edu', field: 'counselorPhone' },
    { re: /辅导员(姓名|名字)?/, type: 'edu', field: 'counselorName' },
    { re: /学历证书(编号|号码)|毕业证(书)?(编号|号码)/, type: 'edu', field: 'diplomaNumber' },
    { re: /是否有海外(教育|学习)经历|海外(教育|学习)经历/, type: 'edu', field: 'overseas' },
    { re: /专业描述|教育经历描述|学习经历描述/, type: 'edu', field: 'description' },
    { re: /班级排名|综合排名/, type: 'edu', field: 'overallRank' },
    { re: /^成绩$/, type: 'edu', field: 'gpa', section: /教育|学习/ },
    // ---------- 手机号区号 ----------
    { re: /区号|国际区号|国家代码|countrycode|手机国家|地区码/, type: 'basic', field: 'phoneCountry' },

    // ---------- 紧急联系人 ----------
    { re: /紧急(联系人|情况)?.*(电话|手机|联系方式)|紧急联络/, type: 'basic', field: 'emergencyPhone' },
    { re: /紧急联系(人|人姓名|人名字)?$|紧急联系/, type: 'basic', field: 'emergencyName' },
    { re: /(紧急联系人|紧急情况).*(关系)|与(本人|联系人)关系/, type: 'basic', field: 'emergencyRelation' },

    // ---------- 证件 ----------
    { re: /证件(类型|种类)|身份证件类型/, type: 'basic', field: 'idType' },
    { re: /证件号|身份证号|身份证码|idcard|idnumber|身份证$/, type: 'basic', field: 'idNumber' },
    { re: /证件(有效期|到期)/, type: 'basic', field: 'idExpire' },

    // ---------- 联系方式 ----------
    { re: /邮箱|电子邮件|email|e-mail|mail地址/, type: 'basic', field: 'email' },
    { re: /备用(邮箱|邮件)/, type: 'basic', field: 'email' },
    { re: /微信号|wechat/, type: 'basic', field: 'wechat' },
    { re: /qq/, type: 'basic', field: 'qq' },
    { re: /手机号码|手机号|手机|移动电话|联系手机|mobile|cellphone|^电话$|联系电话|电话号码|联系方式.*电话|本人电话/, type: 'basic', field: 'phone' },
    { re: /固定电话|座机|办公电话/, type: 'basic', field: 'tel' },

    // ---------- 附加信息（各站点常见必填项）----------
    { re: /英语(等级)?(成绩|分数)|外语(等级)?(成绩|分数)|四六级(成绩|分数)|雅思|托福/, type: 'extra', field: 'englishScore' },
    { re: /英语(等级|水平|级别)|外语(等级|水平)|englishlevel|英语能力/, type: 'extra', field: 'englishLevel' },
    { re: /计算机(水平|等级|能力)|电脑水平|办公软件水平/, type: 'extra', field: 'computerLevel' },
    { re: /应届|往届|毕业生类别|生源类别|毕业类别/, type: 'basic', field: 'graduateType' },
    { re: /家庭(住址|地址|详细地址)|家庭所在/, type: 'basic', field: 'homeAddress' },
    { re: /择业意向|就业意向|应聘方向|求职方向/, type: 'job', field: 'position' },
    { re: /熟悉(专业|领域)|有何特长|专业特长|个人特长|特殊技能/, type: 'basic', field: 'specialty' },

    // ---------- 求职意向（必须排在「职位/地点/薪资」等通用词前面）----------
    { re: /(期望|意向|应聘|申请|求职).*(岗位|职位|职能|方向)|^应聘职位$|^申请职位$|应聘岗位/, type: 'job', field: 'position' },
    { re: /(期望|意向).*行业/, type: 'job', field: 'industry' },
    { re: /(期望|意向).*(城市|地点|地区)|期望工作地/, type: 'job', field: 'city' },
    { re: /求职状态|目前状态|当前状态/, type: 'job', field: 'status' },
    { re: /到岗(时间|日期)|可入职(时间|日期)|最快到岗/, type: 'job', field: 'availableDate' },
    { re: /服从(调剂|分配|安排)/, type: 'job', field: 'acceptAdjust' },
    { re: /(接受|可以).*出差/, type: 'job', field: 'acceptTravel' },
    { re: /(期望|要求).*(薪资|薪酬|待遇)/, type: 'job', field: 'salary' },

    // ---------- 教育 / 学历（先具体后笼统）----------
    { re: /院校(类型|层次|性质)|学校(类型|性质|层次|类别)|是否(985|211)/, type: 'edu', field: 'schoolType' },
    { re: /院校批次|录取批次/, type: 'edu', field: 'schoolBatch' },
    { re: /学习形式|就读形式|培养形式|受教育类型|教育类型|教育形式|受教育形式/, type: 'edu', field: 'studyForm' },
    { re: /培养方式|培养类型/, type: 'edu', field: 'trainMode' },
    { re: /(专业|综合|班级)?排名|名次/, type: 'edu', field: 'majorRank' },
    { re: /gpa|绩点|平均学分绩|平均成绩|均分|平均分/, type: 'edu', field: 'gpa' },
    { re: /主修课程|主要课程|核心课程|所学课程|专业课程|主修.{0,3}课程|课程(名称|列表)/, type: 'edu', field: 'courses' },
    { re: /(论文|毕业设计|毕业论文)(名称|题目|标题)?/, type: 'edu', field: 'thesis' },
    { re: /(论文)?(指导|导师)(教师|老师|姓名)?/, type: 'edu', field: 'thesisAdvisor' },
    { re: /学号|studentid/, type: 'edu', field: 'studentId' },
    { re: /学制|修业年限/, type: 'edu', field: 'duration' },
    { re: /学院|系别|院系|所在院系/, type: 'edu', field: 'college' },
    { re: /专业名称|所学专业|就读专业|^专业$|主修专业|学习专业/, type: 'edu', field: 'major' },
    { re: /(毕业|就读|所在)院校|学校名称|院校名称|^学校$|^院校$|就读学校|毕业学校|大学名称/, type: 'edu', field: 'school' },
    { re: /学历|最高学历|教育程度|文化程度|degreelevel/, type: 'edu', field: 'education' },
    { re: /学位|所获学位|学位类型/, type: 'edu', field: 'degree' },
    { re: /(学校|院校|大学|就读).*(城市|地点)|所在城市|院校所在地/, type: 'edu', field: 'city' },

    // ---------- 实践 / 项目 / 社团里的组合字段（按板块区分）----------
    { re: /证明人(联系方式|电话|手机)/, type: 'project', field: 'phone', section: /项目|实践|科研|课题/ },
    { re: /证明人/, type: 'project', field: 'supervisor', section: /项目|实践|科研|课题/ },
    { re: /(组织|单位)名称及职务|名称及职务/, type: 'project', field: 'nameRole', section: /项目|实践|科研|课题/ },
    { re: /^职位$|^职务$|^角色$|项目职位|担任职位/, type: 'project', field: 'role', section: /项目|实践|科研|课题/ },
    { re: /^(所属)?部门$|所在部门|项目部门/, type: 'project', field: 'department', section: /项目|实践|科研|课题/ },
    { re: /(项目|实践|科研|课题).*(成果|业绩|产出|收获)|取得成果|研究成果/, type: 'project', field: 'achievement', section: /项目|实践|科研|课题/ },
    { re: /本人职责|个人职责|我的职责|个人贡献|职责及业绩|主要职责|主要工作/, type: 'project', field: 'duty', section: /项目|实践|科研|课题/ },
    { re: /工作内容|职责描述|项目(内容|描述|简介|介绍)/, type: 'project', field: 'content', section: /项目|实践|科研|课题/ },
    { re: /(组织|单位)名称及职务|名称及职务/, type: 'campus', field: 'orgRole', section: /社团|校园|学生工作/ },
    { re: /主要职责|职责及业绩|主要工作|工作内容|职责描述/, type: 'campus', field: 'description', section: /社团|校园|学生工作/ },

    // ---------- 技能 ----------
    { re: /技能名称|技能项|技能$/, type: 'skill', field: 'name' },
    { re: /掌握程度|熟练程度|掌握情况|熟练度/, type: 'skill', field: 'level' },
    { re: /使用时间|使用时长|使用年限|掌握时长|使用年数/, type: 'skill', field: 'years' },
    { re: /技能(描述|说明)/, type: 'skill', field: 'description' },

    // ---------- 工作 / 实习 ----------
    { re: /公司名称|单位名称|企业名称|雇主|公司全称|工作单位|实习单位|机构名称|^公司$|^单位$|^企业$/, type: 'intern', field: 'company' },
    // 「证明人职位 / 上级职务」必须排在「职位」之前，否则会被 position 抢走
    { re: /上级(职务|职位)|证明人(职务|职位)|推荐人(职务|职位)/, type: 'intern', field: 'supervisorTitle' },
    { re: /职位名称|岗位名称|担任职位|职位|职务|^岗位$|实习岗位|担任职务/, type: 'intern', field: 'position' },
    { re: /部门|所属部门|所在部门/, type: 'intern', field: 'department' },
    { re: /行业|所属行业/, type: 'intern', field: 'industry' },
    { re: /工作地点|办公地点|工作城市|实习地点|^(工作|实习|办公)?地点$|^(工作|实习)城市$/, type: 'intern', field: 'location' },
    { re: /薪资|薪酬|月薪|工资/, type: 'intern', field: 'salary' },
    { re: /(直属|直接)(上级|领导|主管)|上级姓名|证明人(?!联系|职务|职位|手机)|推荐人(?!联系|职务|职位)/, type: 'intern', field: 'supervisor' },
    { re: /证明人(联系方式|电话|手机)|上级(联系方式|电话)/, type: 'intern', field: 'supervisorPhone' },
    { re: /离职原因|离开原因|离职说明/, type: 'intern', field: 'leaveReason' },
    // 「工作成果」必须排在「工作内容」前面，否则会被更宽的规则抢走
    { re: /工作成果|工作业绩|主要业绩|业绩描述|工作成效|实习成果|实习业绩|主要成果|工作产出|取得成果|工作亮点|工作成绩/, type: 'intern', field: 'achievement' },
    { re: /工作描述|工作内容|职责描述|主要职责|工作职责|实习内容|实习描述|岗位职责|主要工作|工作(任务|事项)|实习(职责|工作)/, type: 'intern', field: 'content' },
    { re: /工作(总结|经历描述)|实习总结/, type: 'intern', field: 'description' },

    // ---------- 项目 ----------
    { re: /(项目|课题).*(担任|角色|职务)|担任(职务|角色)|^职位$|^角色$|项目职位/, type: 'project', field: 'role' },
    { re: /团队(规模|人数)|项目人数|参与人数|^人数$|成员人数/, type: 'project', field: 'teamSize' },
    { re: /项目类型|项目性质|实践方式|实践形式|活动形式|实践类型|参与形式/, type: 'project', field: 'type' },
    { re: /^(所属)?部门$|所在部门|项目部门/, type: 'project', field: 'department' },
    // 「项目成果」排在「项目内容」前
    { re: /项目成果|项目业绩|取得成果|项目产出|实践成果|项目收获|研究成果|项目成绩/, type: 'project', field: 'achievement' },
    { re: /本人职责|个人职责|我的职责|个人贡献|担任职责|主要职责|职责描述|本人工作|个人工作/, type: 'project', field: 'duty' },
    { re: /项目(描述|内容|简介|介绍|背景)|课题(描述|内容)|实践内容|活动内容/, type: 'project', field: 'content' },
    { re: /项目名称|课题名称/, type: 'project', field: 'name' },

    // ---------- 获奖（具体字段排在「奖项名称」前面）----------
    { re: /获奖(时间|日期)|奖励(时间|日期)|授予时间/, type: 'award', field: 'date' },
    // 「获得时间」在证书板块里是证书日期，必须排在通用获奖规则之前
    { re: /(^|[^奖])获得时间|取得时间/, type: 'cert', field: 'date', section: /证书|资格/ },
    { re: /获得时间|取得时间|获得日期/, type: 'award', field: 'date' },
    { re: /颁发(机构|单位)|授予(机构|单位)|颁奖单位/, type: 'award', field: 'issuer' },
    { re: /奖项级别|奖励级别|奖项等级|荣誉级别|奖项层次/, type: 'award', field: 'level' },
    { re: /奖项(描述|说明)|获奖(描述|说明|理由)/, type: 'award', field: 'description' },
    { re: /奖项名称|获奖名称|奖励名称|荣誉名称|所获奖励|荣誉奖项/, type: 'award', field: 'name' },

    // ---------- 证书 ----------
    { re: /证书编号|证书号码|证书号|证件编号/, type: 'cert', field: 'number' },
    { re: /(证书|获取|取得|颁发)(时间|日期)/, type: 'cert', field: 'date' },
    { re: /(颁发|发证|认证)(机构|单位|机关)/, type: 'cert', field: 'issuer' },
    { re: /(证书|技能).*(描述|说明)/, type: 'cert', field: 'description' },
    { re: /证书名称|资格证书|证书类型|取得证书/, type: 'cert', field: 'name' },

    // ---------- 培训 ----------
    { re: /培训(机构|单位|学校)/, type: 'training', field: 'org' },
    { re: /培训形式|授课形式|培训方式/, type: 'training', field: 'form' },
    { re: /培训(科目|内容|专业)/, type: 'training', field: 'subject' },
    { re: /(取得|获得)(成果|证书|收获)|培训成果/, type: 'training', field: 'result' },
    { re: /培训(描述|说明|经历)/, type: 'training', field: 'description' },
    { re: /培训(名称|课程|项目)/, type: 'training', field: 'name' },

    // ---------- 校园 / 社团 ----------
    { re: /(校园|社团|组织|学生会).*(职务|角色|职位)/, type: 'campus', field: 'role' },
    { re: /(职务|工作|活动)描述|校园经历描述|社团经历/, type: 'campus', field: 'description' },
    { re: /(?<!颁发|授予|认证|发证|培训|所在)(社团|学生会|协会|组织)(名称)?$|社团名称/, type: 'campus', field: 'org' },

    // ---------- 家庭 ----------
    { re: /(家庭成员|家庭情况|家属|成员).*(姓名|名字)/, type: 'family', field: 'name' },
    { re: /(成员|家属|家庭).*(关系)|与本人关系|称谓/, type: 'family', field: 'relation' },
    { re: /(成员|家庭|家属).*(工作单位|单位)|父亲(单位|工作)|母亲(单位|工作)/, type: 'family', field: 'company' },
    { re: /(成员|家庭|家属).*(职务|职位)/, type: 'family', field: 'title' },
    { re: /(成员|家庭|家属).*(电话|手机)/, type: 'family', field: 'phone' },
    { re: /(成员|家庭|家属).*(出生|生日)/, type: 'family', field: 'birth' },
    { re: /(成员|家庭|家属).*(政治面貌)/, type: 'family', field: 'politics' },

    // ---------- 时间（按所在板块判断归属）----------
    { re: /(入学|开始|起始|入职|参加|起始).*(时间|日期)|^开始时间$|^起始时间$|^入学时间$/, type: 'auto', field: 'start' },
    { re: /(毕业|结束|离职|离开|终止).*(时间|日期)|^结束时间$|^毕业时间$/, type: 'auto', field: 'end' },

    // ---------- 个人基本信息 ----------
    { re: /^姓名$|真实姓名|中文姓名|申请人姓名|本人姓名|^名字$|^name$/, type: 'basic', field: 'name' },
    { re: /英文名|英文姓名|englishname|拼音姓名|姓名拼音/, type: 'basic', field: 'englishName' },
    { re: /^性别$|gender|^sex$/, type: 'basic', field: 'gender' },
    { re: /出生(日期|年月|时间)|生日|birth/, type: 'basic', field: 'birth' },
    { re: /年龄|(?:^|[.\[\]_-])age(?:$|[.\[\]_-])/, type: 'basic', field: 'age' },
    { re: /民族|nation/, type: 'basic', field: 'nation' },
    { re: /政治面貌|党派|party/, type: 'basic', field: 'politics' },
    { re: /(入党|入团|政治面貌).*(时间|日期)/, type: 'basic', field: 'politicsDate' },
    { re: /婚姻|婚否|marital/, type: 'basic', field: 'marriage' },
    { re: /籍贯|祖籍|nativeplace/, type: 'basic', field: 'hometown' },
    { re: /户籍(所在地|地址|省份|城市|区县|类型)?|户口(所在地|地址|性质)?/, type: 'basic', field: 'household' },
    { re: /生源(地|所在地|省份|城市|区县)?/, type: 'basic', field: 'sourcePlace' },
    { re: /现居(住)?(地|地址|城市|省份|区县)?|居住地|现住址|目前所在地|通讯地址|联系地址|家庭地址|详细地址|^地址$/, type: 'basic', field: 'address' },
    { re: /邮编|邮政编码|postcode|zipcode/, type: 'basic', field: 'zip' },
    { re: /身高|height/, type: 'basic', field: 'height' },
    { re: /体重|weight/, type: 'basic', field: 'weight' },
    { re: /血型|blood/, type: 'basic', field: 'bloodType' },
    { re: /健康|身体状况/, type: 'basic', field: 'health' },
    { re: /最高(学历|学位)/, type: 'basic', field: 'highestEducation' },
    { re: /档案(所在单位|所在地|所在|单位|存放|地点|保管)/, type: 'basic', field: 'archiveUnit' },
    { re: /高考(分数|成绩)/, type: 'basic', field: 'gaokaoScore' },
    { re: /高考(科目|科类|文理)/, type: 'basic', field: 'gaokaoSubject' },
    { re: /特长|专长|技能特长/, type: 'basic', field: 'specialty' },
    { re: /爱好|兴趣/, type: 'basic', field: 'hobbies' },

    // ---------- 自我评价 ----------
    { re: /^自我介绍$|^一句话(介绍|描述)$|个人简介|个人(描述|陈述|总结)/, type: 'self', field: 'intro' },
    { re: /自我(评价|描述|介绍|鉴定)|个人评价|个人优势|自我评价|我的优势|优势说明|个人亮点/, type: 'self', field: 'evaluation' },
  ];

  // 板块名称 -> 归属类型（用于「开始时间/结束时间」这类无归属字段）
  TT.SECTION_TYPE = [
    { re: /教育|学历|学习经历|就读|院校/, type: 'edu' },
    { re: /实习|工作经历|任职|职业经历|履历/, type: 'intern' },
    { re: /项目|课题|实践|科研/, type: 'project' },
    { re: /校园|社团|学生工作|组织经历/, type: 'campus' },
    { re: /获奖|荣誉|奖励/, type: 'award' },
    { re: /技能/, type: 'skill' },
    { re: /证书|资格/, type: 'cert' },
    { re: /家庭|家属|成员/, type: 'family' },
    { re: /培训|进修/, type: 'training' },
  ];

  /* ---------- 选区填入时让用户手动选的「一级目录」 ---------- */
  TT.TYPE_NAMES = [
    { type: '', name: '自动识别（按页面标签）' },
    { type: 'basic', name: '基本信息（姓名/手机/邮箱…）' },
    { type: 'job', name: '求职意向' },
    { type: 'extra', name: '附加信息（英语/计算机/应届）' },
    { type: 'self', name: '自我评价' },
    { type: 'edu', name: '教育经历' },
    { type: 'intern', name: '实习 / 工作经历' },
    { type: 'project', name: '项目 / 实践经历' },
    { type: 'campus', name: '社团 / 校园经历' },
    { type: 'award', name: '获奖经历' },
    { type: 'cert', name: '证书' },
    { type: 'skill', name: '技能' },
    { type: 'family', name: '家庭情况' },
    { type: 'training', name: '培训经历' },
  ];

  /* 手动纠错用：把「A 类的某个字段」翻译成「B 类里语义相同的字段」。
     例：选区里标签是「实习内容」却被认成项目经历，用户指定「实习/工作经历」后，
         project.description 就映射成 intern.description。 */
  TT.SEM_OF = {
    'edu.school': 'name', 'intern.company': 'name', 'project.name': 'name', 'campus.org': 'name',
    'award.name': 'name', 'cert.name': 'name', 'skill.name': 'name',
    'family.name': 'name', 'training.name': 'name',
    'project.nameRole': 'name', 'campus.orgRole': 'name',
    'edu.description': 'desc', 'intern.description': 'desc', 'project.description': 'desc',
    'campus.description': 'desc', 'award.description': 'desc', 'cert.description': 'desc',
    'skill.description': 'desc', 'training.description': 'desc',
    // 明细字段（工作内容 / 工作成果 / 本人职责 / 项目成果）
    'intern.content': 'content', 'project.content': 'content', 'campus.content': 'content',
    'award.content': 'content', 'cert.content': 'content', 'training.content': 'content',
    'intern.achievement': 'achieve', 'project.achievement': 'achieve', 'campus.achievement': 'achieve',
    'award.achievement': 'achieve', 'cert.achievement': 'achieve', 'training.achievement': 'achieve',
    'project.duty': 'duty', 'intern.duty': 'duty', 'campus.duty': 'duty',
    'intern.supervisorTitle': 'supTitle', 'project.supervisorTitle': 'supTitle',
    'project.teamSize': 'member', 'intern.teamSize': 'member',
    'project.type': 'form', 'campus.type': 'form',
    'project.department': 'dept', 'intern.department': 'dept', 'edu.college': 'dept',
    'intern.industry': 'industry', 'intern.location': 'place', 'intern.salary': 'salary',
    'intern.leaveReason': 'leave',
    'edu.startDate': 'start', 'intern.startDate': 'start', 'project.startDate': 'start',
    'campus.startDate': 'start', 'training.startDate': 'start',
    'edu.endDate': 'end', 'intern.endDate': 'end', 'project.endDate': 'end',
    'campus.endDate': 'end', 'training.endDate': 'end',
    'edu.start': 'start', 'intern.start': 'start', 'project.start': 'start',
    'campus.start': 'start', 'training.start': 'start',
    'edu.end': 'end', 'intern.end': 'end', 'project.end': 'end',
    'campus.end': 'end', 'training.end': 'end',
    'basic.phone': 'phone', 'basic.tel': 'phone', 'basic.mobile': 'phone',
    'edu.major': 'sub', 'intern.department': 'sub', 'edu.college': 'sub',
    'intern.position': 'role', 'project.role': 'role', 'campus.role': 'role',
    'intern.supervisor': 'person', 'project.supervisor': 'person',
    'intern.supervisorPhone': 'phone', 'project.phone': 'phone',
    'award.date': 'date', 'cert.date': 'date', 'skill.years': 'dur',
    'edu.education': 'level', 'skill.level': 'level', 'award.level': 'level',
    'edu.studyForm': 'form', 'award.issuer': 'issuer', 'cert.issuer': 'issuer',
  };

  TT.SEM = {
    name: { edu: 'school', intern: 'company', project: 'name', campus: 'org', award: 'name', cert: 'name', skill: 'name', family: 'name', training: 'name' },
    desc: { edu: 'description', intern: 'description', project: 'description', campus: 'description', award: 'description', cert: 'description', skill: 'description', training: 'description' },
    // 「工作内容 / 项目内容」这类主体描述
    content: { edu: 'description', intern: 'content', project: 'content', campus: 'description', award: 'description', cert: 'description', skill: 'description', training: 'description' },
    // 「成果」类
    achieve: { intern: 'achievement', project: 'achievement', campus: 'achievement', award: 'achievement', cert: 'achievement', training: 'achievement' },
    // 「本人职责」类
    duty: { project: 'duty', campus: 'description', intern: 'content' },
    supTitle: { intern: 'supervisorTitle', project: 'supervisorTitle' },
    member: { project: 'teamSize', intern: 'teamSize' },
    form: { project: 'type', campus: 'type' },
    dept: { intern: 'department', project: 'department', edu: 'college' },
    industry: { intern: 'industry', project: 'industry' },
    place: { intern: 'location', project: 'location' },
    salary: { intern: 'salary' },
    leave: { intern: 'leaveReason' },
    start: { edu: 'start', intern: 'start', project: 'start', campus: 'start', training: 'start' },
    end: { edu: 'end', intern: 'end', project: 'end', campus: 'end', training: 'end' },
    sub: { edu: 'major', intern: 'department' },
    role: { intern: 'position', campus: 'role', project: 'role' },
    person: { intern: 'supervisor', project: 'supervisor' },
    phone: { intern: 'supervisorPhone', project: 'phone' },
    date: { award: 'date', cert: 'date' },
    level: { edu: 'education', skill: 'level', award: 'level' },
    dur: { skill: 'years' },
  };
})();
