/* 直接读取「简历信息-*.xlsx」，转换成插件内的 profile 结构
 * 表格约定：三列 —— 分组标题 | 字段名 | 填写内容（与 tools/convert_resume.py 完全一致）
 */
(function () {
  const MAPS = {
    basic: {
      姓名: 'name', 英文名: 'englishName', 性别: 'gender', 出生日期: 'birth', 民族: 'nation',
      政治面貌: 'politics', 政治面貌时间: 'politicsDate', 婚姻状况: 'marriage', 证件类型: 'idType',
      身份证号: 'idNumber', 证件号码: 'idNumber', 手机号: 'phone', 邮箱: 'email', 微信号: 'wechat',
      QQ号: 'qq', 户籍所在地: 'household', 户籍省份: 'householdProvince', 户籍城市: 'householdCity',
      户籍区县: 'householdDistrict', 户籍类型: 'householdType', 籍贯: 'hometown', 生源地: 'sourcePlace',
      生源省份: 'sourceProvince', 生源城市: 'sourceCity', 生源区县: 'sourceDistrict',
      现居住地: 'currentPlace', 现居省份: 'currentProvince', 现居城市: 'currentCity',
      现居区县: 'currentDistrict', 现居地址: 'address', 邮政编码: 'zip', 身高: 'height',
      体重: 'weight', 血型: 'bloodType', 健康状况: 'health', 最高学历: 'highestEducation',
      最高学位: 'highestDegree', 毕业时间: 'graduationDate', 档案所在单位: 'archiveUnit',
      高考分数: 'gaokaoScore', 高考科目: 'gaokaoSubject', 紧急联系人: 'emergencyName',
      紧急联系电话: 'emergencyPhone', 与联系人关系: 'emergencyRelation', 特长: 'specialty',
      兴趣爱好: 'hobbies',
    },
    job: {
      期望岗位: 'position', 期望行业: 'industry', 期望城市: 'city', 求职状态: 'status',
      到岗时间: 'availableDate', 是否服从调剂: 'acceptAdjust', 是否接受出差: 'acceptTravel', 期望薪资: 'salary',
    },
    edu: {
      学校: 'school', 开始时间: 'start', 结束时间: 'end', 学历: 'education', 学位: 'degree',
      学习形式: 'studyForm', 院校类型: 'schoolType', 院校批次: 'schoolBatch', 学院: 'college',
      专业: 'major', 学号: 'studentId', 学制: 'duration', 所在城市: 'city', 培养方式: 'trainMode',
      GPA: 'gpa', 专业排名: 'majorRank', 综合排名: 'overallRank', 主修课程: 'courses',
      论文名称: 'thesis', 论文导师: 'thesisAdvisor', 平均分: 'avgScore',
      辅导员姓名: 'counselorName', 辅导员: 'counselorName', 辅导员联系方式: 'counselorPhone',
      是否有海外教育经历: 'overseas', 学历证书编号: 'diplomaNumber', 专业描述: 'description',
    },
    intern: {
      公司名称: 'company', 公司: 'company', 单位名称: 'company',
      职位名称: 'position', 职位: 'position', 岗位: 'position',
      所属部门: 'department', 部门: 'department', 所属行业: 'industry', 行业: 'industry',
      工作地点: 'location', 地点: 'location', 开始时间: 'start', 结束时间: 'end', 薪资: 'salary',
      工资: 'salary', 月薪: 'salary',
      直属上级: 'supervisor', 证明人姓名: 'supervisor', 证明人: 'supervisor',
      上级职务: 'supervisorTitle', 证明人职位: 'supervisorTitle', 上级职位: 'supervisorTitle',
      证明人联系方式: 'supervisorPhone', 上级联系方式: 'supervisorPhone',
      离职原因: 'leaveReason',
      工作内容: 'content', 实习内容: 'content', 主要职责: 'content', 岗位职责: 'content',
      工作成果: 'achievement', 工作业绩: 'achievement', 主要业绩: 'achievement',
      职责描述: 'description', 工作描述: 'description',
    },
    project: {
      项目名称: 'name', 担任职务: 'role', 职位: 'role', 角色: 'role',
      开始时间: 'start', 结束时间: 'end', 部门: 'department', 所属部门: 'department',
      团队规模: 'teamSize', 参与人数: 'teamSize', 项目类型: 'type', 实践方式: 'type',
      项目内容: 'content', 项目描述: 'content', 项目简介: 'content',
      本人职责: 'duty', 个人职责: 'duty', 项目职责: 'duty',
      项目成果: 'achievement', 项目业绩: 'achievement', 取得成果: 'achievement',
    },
    campus: { 组织名称: 'org', 担任职务: 'role', 开始时间: 'start', 结束时间: 'end', 职务描述: 'description' },
    award: { 奖项名称: 'name', 获奖时间: 'date', 颁发机构: 'issuer', 奖项级别: 'level', 奖项描述: 'description' },
    cert: { 证书名称: 'name', 获取时间: 'date', 证书编号: 'number', 颁发机构: 'issuer', 证书描述: 'description' },
    family: {
      姓名: 'name', 关系: 'relation', 出生日期: 'birth', 联系电话: 'phone', 工作单位: 'company',
      职务: 'title', 政治面貌: 'politics', 现居地: 'location',
    },
    training: {
      培训名称: 'name', 开始时间: 'start', 结束时间: 'end', 培训机构: 'org', 培训形式: 'form',
      培训科目: 'subject', 取得成果: 'result', 培训描述: 'description',
    },
  };

  const LIST_KEYS = {
    edu: 'educations', intern: 'internships', project: 'projects', campus: 'campus',
    award: 'awards', cert: 'certs', family: 'family', training: 'trainings',
  };

  function groupType(g) {
    g = String(g || '');
    if (/^基本信息/.test(g)) return 'basic';
    if (/^求职意向/.test(g)) return 'job';
    if (/教育经历/.test(g)) return 'edu';
    if (/^实习经历/.test(g)) return 'intern';
    if (/^项目经历/.test(g)) return 'project';
    if (/^校园经历/.test(g)) return 'campus';
    if (/^获奖经历/.test(g)) return 'award';
    if (/^证书/.test(g)) return 'cert';
    if (/^家庭/.test(g)) return 'family';
    if (/^培训/.test(g)) return 'training';
    if (/^自我描述/.test(g)) return 'self';
    return 'other';
  }

  function cell(v) {
    if (v == null) return '';
    if (v instanceof Date) {
      const p = (n) => String(n).padStart(2, '0');
      return v.getFullYear() + '-' + p(v.getMonth() + 1) + '-' + p(v.getDate());
    }
    return String(v).trim();
  }

  const normKey = (k) => String(k || '').replace(/[\s*:：]/g, '');

  /* rows: [[分组, 字段, 内容], ...] */
  function fromRows(rows) {
    const profile = {
      name: '', basic: {}, job: {}, educations: [], internships: [], projects: [], campus: [],
      awards: [], certs: [], family: [], trainings: [], self: {}, extras: {},
    };
    let curGroup = null;
    let curRec = null;
    for (const r of rows) {
      const group = cell(r[0]);
      const key = normKey(r[1]);
      const val = cell(r[2]);
      if (!key) continue;
      const type = groupType(group);
      if (type === 'self') {
        profile.self[/一句话/.test(key) ? 'intro' : 'evaluation'] = val;
        continue;
      }
      if (type === 'family') {
        const m = key.match(/^成员(\d+)-(.*)$/);
        if (m) {
          const i = Number(m[1]);
          while (profile.family.length < i) profile.family.push({});
          const f = MAPS.family[m[2]];
          if (f) profile.family[i - 1][f] = val;
        }
        continue;
      }
      if (type === 'basic' || type === 'job') {
        const k = MAPS[type][key];
        if (k) profile[type][k] = val;
        else profile.extras[key] = val;
        continue;
      }
      if (type === 'other') {
        profile.extras[key] = val;
        continue;
      }
      const list = profile[LIST_KEYS[type]];
      if (group !== curGroup) {
        curGroup = group;
        curRec = {};
        list.push(curRec);
      }
      const k = MAPS[type][key];
      if (!k) continue;
      if (curRec[k]) {
        curRec = {}; // 同组字段重复 => 下一条记录
        list.push(curRec);
      }
      curRec[k] = val;
    }
    profile.name = profile.basic.name || profile.name;
    return profile;
  }

  if (typeof window !== 'undefined') window.profileFromRows = fromRows;

  window.importXlsx = async function (file) {
    if (typeof XLSX === 'undefined') throw new Error('Excel 解析库未加载，请重新打开资料库页面');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
    const start = rows.length && String(rows[0][0] || '').indexOf('标题') >= 0 ? 1 : 0;
    return fromRows(rows.slice(start));
  };
})();
