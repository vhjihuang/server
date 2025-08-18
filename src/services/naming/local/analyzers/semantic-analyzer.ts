import nlp from 'compromise';
const winkNLP = require('wink-nlp');
import model from 'wink-eng-lite-web-model';
import nodeNlp from 'node-nlp';
import franc from 'franc-min';
import pluralize from 'pluralize';
import stemmer from 'stemmer';
import { uniq } from 'lodash';
import type { SemanticAnalysisResult, FrameworkConventions } from '../../types';

// 初始化 wink-nlp 实例
const nlpInstance = winkNLP.default(model);
const its = nlpInstance.its;

// 初始化 node-nlp 实例用于中文处理
const nlpContainer = nodeNlp.containerBootstrap();
nlpContainer.useChinese();

export class SemanticAnalyzer {
  /**
   * 对文本进行语义分析，提取动词、名词、形容词，并推断其他信息。
   * @param text 待分析文本
   * @returns 包含标准化动词和名词的语义分析结果
   */
  analyze(text: string): SemanticAnalysisResult {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return {
        originalText: text,
        verbs: [],
        nouns: [],
        adjectives: [],
        frameworkHints: {},
        semanticRoles: {},
      };
    }

    // 检测文本语言
    const language = franc(text);
    
    // 如果检测到是中文，先进行翻译处理
    let processedText = text;
    if (language === 'cmn' || /[\u4e00-\u9fa5]/.test(text)) {
      processedText = this.translateChineseToEnglish(text);
    }

    // 使用 compromise 进行基础分析
    const compromiseDoc = nlp(processedText);
    
    // 使用 wink-nlp 进行深度语义分析
    const winkDoc = nlpInstance.readDoc(processedText);
    
    // 提取词性标注结果
    const posTags = this.extractPosTags(winkDoc);
    
    // 提取命名实体
    const namedEntities = this.extractNamedEntities(winkDoc);
    
    // 提取语义关系
    const relationships = this.extractSemanticRelationships(winkDoc);
    
    // 使用 compromise 提取动词、名词、形容词
    const verbs = this.extractVerbs(compromiseDoc);
    const nouns = this.extractNouns(compromiseDoc);
    const adjectives = this.extractAdjectives(compromiseDoc);
    
    // 检测框架提示
    const frameworkHints: FrameworkConventions = this.detectFrameworkHints(processedText);
    
    // 语义角色标注
    const semanticRoles = this.performSemanticRoleLabeling(winkDoc, compromiseDoc);

    return {
      originalText: text,
      verbs: uniq(verbs),
      nouns: uniq(nouns),
      adjectives: uniq(adjectives),
      posTags,
      namedEntities,
      relationships,
      frameworkHints,
      semanticRoles,
    };
  }
  
  private translateChineseToEnglish(text: string): string {
    // 使用简单的分词方法处理中文文本
    // 在实际应用中，可以使用更专业的中文分词库
    const tokens = text.split(/[\s\p{P}]+/u).filter(token => token.trim());
    
    // 翻译每个词汇 - 使用更智能的方法而不是硬编码映射
    const translatedTokens = tokens.map((token: string) => {
      // 对于每个中文词汇，尝试多种翻译策略
      
      // 1. 首先检查是否是已知的专业术语
      const knownTerm = this.getKnownTechnicalTerm(token);
      if (knownTerm) {
        return knownTerm;
      }
      
      // 2. 尝试分解复合词
      const decomposed = this.decomposeChineseCompound(token);
      if (decomposed && decomposed.length > 0) {
        return decomposed.join(' ');
      }
      
      // 3. 使用语义相似度方法
      const semanticMatch = this.findSemanticMatch(token);
      if (semanticMatch) {
        return semanticMatch;
      }
      
      // 4. 如果所有方法都失败，使用原词作为最后的备选
      return token;
    });
    
    return translatedTokens.join(' ');
  }
  
  private getKnownTechnicalTerm(token: string): string | null {
    // 常见的技术术语映射（比之前更精简，只包含最常用的）
    const technicalTerms: Record<string, string> = {
      '项目': 'project',
      '用户': 'user',
      '数据': 'data',
      '列表': 'list',
      '表单': 'form',
      '页面': 'page',
      '组件': 'component',
      '服务': 'service',
      '函数': 'function',
      '方法': 'method',
      '类': 'class',
      '接口': 'interface',
      '类型': 'type',
      '枚举': 'enum',
      '常量': 'constant',
      '变量': 'variable',
      '状态': 'state',
      '属性': 'property',
      '配置': 'config',
      '参数': 'param',
      '结果': 'result',
      '按钮': 'button',
      '输入': 'input',
      '输出': 'output',
      '处理': 'process',
      '计算': 'calculate',
      '过滤': 'filter',
      '排序': 'sort',
      '搜索': 'search',
      '验证': 'validate',
      '登录': 'login',
      '注册': 'register',
      '权限': 'permission',
      '角色': 'role',
      '设置': 'setting',
      '主题': 'theme',
      '样式': 'style',
      '布局': 'layout',
      '模板': 'template',
      '视图': 'view',
      '模型': 'model',
      '路由': 'route',
      '数据库': 'database',
      '缓存': 'cache',
      '会话': 'session',
      '令牌': 'token',
      '密钥': 'key',
      '密码': 'password',
      '账户': 'account',
      '支付': 'payment',
      '订单': 'order',
      '商品': 'product',
      '价格': 'price',
      '通知': 'notification',
      '消息': 'message',
      '任务': 'task',
      '事件': 'event',
      '活动': 'activity',
      '评论': 'comment',
      '分享': 'share',
      '关注': 'follow',
      '个人资料': 'profile',
      '头像': 'avatar',
      '颜色': 'color',
      '字体': 'font',
      '大小': 'size',
      '位置': 'position',
      '宽度': 'width',
      '高度': 'height',
      '加载': 'load',
      '刷新': 'refresh',
      '重置': 'reset',
      '清空': 'clear',
      '复制': 'copy',
      '粘贴': 'paste',
      '删除': 'delete',
      '撤销': 'undo',
      '重做': 'redo',
      '打印': 'print',
      '导出': 'export',
      '导入': 'import',
      '下载': 'download',
      '上传': 'upload',
      '启动': 'start',
      '停止': 'stop',
      '运行': 'run',
      '调试': 'debug',
      '测试': 'test',
      '部署': 'deploy',
      '发布': 'publish',
      '构建': 'build',
      '编译': 'compile'
    };
    
    return technicalTerms[token] || null;
  }
  
  private decomposeChineseCompound(token: string): string[] | null {
    // 常见的中文复合词分解规则
    const decompositionRules: Record<string, string[]> = {
      // 动词+名词组合
      '创建': ['create'],
      '添加': ['add'],
      '删除': ['delete'],
      '更新': ['update'],
      '修改': ['modify'],
      '获取': ['get'],
      '查询': ['query'],
      '保存': ['save'],
      '提交': ['submit'],
      '取消': ['cancel'],
      '处理': ['process'],
      '计算': ['calculate'],
      '过滤': ['filter'],
      '排序': ['sort'],
      '搜索': ['search'],
      '查找': ['find'],
      '验证': ['validate'],
      '确认': ['confirm'],
      '登录': ['login'],
      '注册': ['register'],
      '注销': ['logout'],
      '设置': ['set', 'config'],
      '加载': ['load'],
      '刷新': ['refresh'],
      '重置': ['reset'],
      '清空': ['clear'],
      '复制': ['copy'],
      '粘贴': ['paste'],
      '剪切': ['cut'],
      '撤销': ['undo'],
      '重做': ['redo'],
      '打印': ['print'],
      '导出': ['export'],
      '导入': ['import'],
      '下载': ['download'],
      '上传': ['upload'],
      '安装': ['install'],
      '卸载': ['uninstall'],
      '启动': ['start'],
      '停止': ['stop'],
      '暂停': ['pause'],
      '继续': ['resume'],
      '运行': ['run'],
      '调试': ['debug'],
      '测试': ['test'],
      '部署': ['deploy'],
      '发布': ['publish'],
      '构建': ['build'],
      '编译': ['compile'],
      '打包': ['package'],
      '压缩': ['compress'],
      '解压': ['decompress'],
      '加密': ['encrypt'],
      '解密': ['decrypt'],
      '签名': ['sign'],
      '认证': ['authenticate'],
      '授权': ['authorize'],
      '同步': ['sync'],
      
      // 名词组合
      '项目': ['project'],
      '用户': ['user'],
      '数据': ['data'],
      '信息': ['info'],
      '列表': ['list'],
      '详情': ['detail'],
      '表单': ['form'],
      '页面': ['page'],
      '组件': ['component'],
      '服务': ['service'],
      '工具': ['util', 'tool'],
      '函数': ['function'],
      '方法': ['method'],
      '类': ['class'],
      '接口': ['interface'],
      '类型': ['type'],
      '枚举': ['enum'],
      '常量': ['constant'],
      '变量': ['variable'],
      '状态': ['state'],
      '属性': ['property'],
      '配置': ['config'],
      '选项': ['option'],
      '参数': ['param'],
      '结果': ['result'],
      '响应': ['response'],
      '请求': ['request'],
      '错误': ['error'],
      '异常': ['exception'],
      '日志': ['log'],
      '文件': ['file'],
      '图片': ['image'],
      '视频': ['video'],
      '音频': ['audio'],
      '文档': ['document'],
      '报告': ['report'],
      '统计': ['statistic'],
      '分析': ['analysis'],
      '图表': ['chart'],
      '表格': ['table'],
      '卡片': ['card'],
      '面板': ['panel'],
      '导航': ['navigation'],
      '菜单': ['menu'],
      '按钮': ['button'],
      '链接': ['link'],
      '输入': ['input'],
      '输出': ['output']
    };
    
    // 直接匹配
    if (decompositionRules[token]) {
      return decompositionRules[token];
    }
    
    // 尝试分解复合词（简单的两字词）
    if (token.length === 2) {
      const firstChar = token.charAt(0);
      const secondChar = token.charAt(1);
      
      const firstTranslation = decompositionRules[firstChar];
      const secondTranslation = decompositionRules[secondChar];
      
      if (firstTranslation && secondTranslation) {
        // 合并两个词的翻译，去重
        return [...new Set([...firstTranslation, ...secondTranslation])];
      }
    }
    
    // 尝试分解三字词
    if (token.length === 3) {
      const firstTwo = token.substring(0, 2);
      const lastChar = token.charAt(2);
      
      const firstTwoTranslation = decompositionRules[firstTwo];
      const lastCharTranslation = decompositionRules[lastChar];
      
      if (firstTwoTranslation && lastCharTranslation) {
        return [...new Set([...firstTwoTranslation, ...lastCharTranslation])];
      }
    }
    
    return null;
  }
  
  private findSemanticMatch(token: string): string | null {
    // 基于语义相似度的匹配方法
    // 这里使用简单的模式匹配，实际项目中可以使用更复杂的语义分析
    
    // 动词模式匹配
    if (/(创建|添加|新增|建立)/.test(token)) return 'create';
    if (/(删除|移除|清除)/.test(token)) return 'delete';
    if (/(更新|修改|更改|编辑)/.test(token)) return 'update';
    if (/(获取|取得|拿|读取|读)/.test(token)) return 'get';
    if (/(查询|搜索|查找|搜)/.test(token)) return 'query';
    if (/(保存|存储|存)/.test(token)) return 'save';
    if (/(提交|发送|传送)/.test(token)) return 'submit';
    if (/(取消|撤销)/.test(token)) return 'cancel';
    if (/(处理|操作)/.test(token)) return 'process';
    if (/(计算|算)/.test(token)) return 'calculate';
    if (/(过滤|筛选)/.test(token)) return 'filter';
    if (/(排序|排列)/.test(token)) return 'sort';
    if (/(验证|校验|检查)/.test(token)) return 'validate';
    if (/(确认|确定)/.test(token)) return 'confirm';
    if (/(登录|登入)/.test(token)) return 'login';
    if (/(注册| signup)/.test(token)) return 'register';
    if (/(注销|登出|退出)/.test(token)) return 'logout';
    if (/(设置|设定|配置)/.test(token)) return 'set';
    if (/(加载|载入)/.test(token)) return 'load';
    if (/(刷新|重载)/.test(token)) return 'refresh';
    if (/(重置|重设)/.test(token)) return 'reset';
    if (/(清空|清)/.test(token)) return 'clear';
    if (/(复制|拷贝)/.test(token)) return 'copy';
    if (/(粘贴|贴)/.test(token)) return 'paste';
    if (/(剪切|切)/.test(token)) return 'cut';
    if (/(运行|执行)/.test(token)) return 'run';
    if (/(调试|除错)/.test(token)) return 'debug';
    if (/(测试|测)/.test(token)) return 'test';
    if (/(部署|发布)/.test(token)) return 'deploy';
    if (/(构建|编译|打包)/.test(token)) return 'build';
    
    // 名词模式匹配
    if (/(项目|工程)/.test(token)) return 'project';
    if (/(用户|人员|客户)/.test(token)) return 'user';
    if (/(数据|资料)/.test(token)) return 'data';
    if (/(列表|清单)/.test(token)) return 'list';
    if (/(详情|详细信息)/.test(token)) return 'detail';
    if (/(表单|表格|单子)/.test(token)) return 'form';
    if (/(页面|页)/.test(token)) return 'page';
    if (/(组件|部件|元件)/.test(token)) return 'component';
    if (/(服务|服务程序)/.test(token)) return 'service';
    if (/(工具|工具集)/.test(token)) return 'util';
    if (/(函数|功能)/.test(token)) return 'function';
    if (/(方法|方式|办法)/.test(token)) return 'method';
    if (/(类|类别|类型)/.test(token)) return 'class';
    if (/(接口|界面)/.test(token)) return 'interface';
    if (/(枚举|枚举类型)/.test(token)) return 'enum';
    if (/(常量|常数)/.test(token)) return 'constant';
    if (/(变量|变数)/.test(token)) return 'variable';
    if (/(状态|状况)/.test(token)) return 'state';
    if (/(属性|特性)/.test(token)) return 'property';
    if (/(配置|配置项)/.test(token)) return 'config';
    if (/(参数|参量)/.test(token)) return 'param';
    if (/(结果|成果)/.test(token)) return 'result';
    if (/(响应|回应)/.test(token)) return 'response';
    if (/(请求|要求)/.test(token)) return 'request';
    if (/(错误|错误信息)/.test(token)) return 'error';
    if (/(异常|例外)/.test(token)) return 'exception';
    if (/(日志|记录)/.test(token)) return 'log';
    if (/(文件|文档|档案)/.test(token)) return 'file';
    if (/(图片|图像|照片)/.test(token)) return 'image';
    if (/(视频|录像)/.test(token)) return 'video';
    if (/(音频|声音)/.test(token)) return 'audio';
    if (/(报告|报表)/.test(token)) return 'report';
    if (/(统计|统计数据)/.test(token)) return 'statistic';
    if (/(分析|分析结果)/.test(token)) return 'analysis';
    if (/(图表|图形)/.test(token)) return 'chart';
    if (/(表格|表)/.test(token)) return 'table';
    if (/(卡片|卡)/.test(token)) return 'card';
    if (/(面板|板)/.test(token)) return 'panel';
    if (/(导航|导航栏)/.test(token)) return 'navigation';
    if (/(菜单|菜单栏)/.test(token)) return 'menu';
    if (/(按钮|按键)/.test(token)) return 'button';
    if (/(链接|连接)/.test(token)) return 'link';
    if (/(输入|输入框)/.test(token)) return 'input';
    if (/(输出|输出框)/.test(token)) return 'output';
    
    return null;
  }
  
  private getPinyinFallback(token: string): string {
    // 简单的拼音转换作为最后的备选方案
    // 实际项目中可以使用 pinyin 或其他拼音库
    
    // 这里只是一个示例，实际应该使用拼音库
    const pinyinMap: Record<string, string> = {
      '项目': 'xiang4mu4',
      '用户': 'yong4hu4',
      '数据': 'shu4ju4',
      '列表': 'lie4biao3',
      '表单': 'biao3dan1',
      '页面': 'ye4mian4',
      '组件': 'zu3jian4',
      '服务': 'fu2wu4',
      '函数': 'han2shu4',
      '方法': 'fang1fa3',
      '类': 'lei4',
      '接口': 'jie1kou3',
      '类型': 'lei4xing2',
      '枚举': 'mei2ju3',
      '常量': 'chang2liang4',
      '变量': 'bian4liang4',
      '状态': 'zhuang4tai4',
      '属性': 'shu3xing4',
      '配置': 'pei4zhi4',
      '参数': 'can1shu4',
      '结果': 'jie2guo3',
      '按钮': 'an4niu3',
      '输入': 'shu1ru4',
      '输出': 'shu1chu1'
    };
    
    // 返回拼音或原词
    return pinyinMap[token] || token.toLowerCase().replace(/\s+/g, '');
  }
  
  private extractPosTags(doc: any): Record<string, string[]> {
    const posTags: Record<string, string[]> = {};
    
    // 获取所有词性标记
    doc.tokens().each((token: any) => {
      const pos = token.out(its.pos);
      const text = token.out(its.value);
      
      if (!posTags[pos]) {
        posTags[pos] = [];
      }
      posTags[pos].push(text);
    });
    
    return posTags;
  }
  
  private extractNamedEntities(doc: any): Record<string, string[]> {
    const entities: Record<string, string[]> = {};
    
    // 提取命名实体
    doc.entities().each((entity: any) => {
      const type = entity.out(its.type);
      const text = entity.out(its.value);
      
      if (!entities[type]) {
        entities[type] = [];
      }
      entities[type].push(text);
    });
    
    return entities;
  }
  
  private extractSemanticRelationships(doc: any): Record<string, string[]> {
    const relationships: Record<string, string[]> = {};
    
    // 提取动词-名词关系
    doc.tokens().filter((token: any) => token.out(its.pos) === 'VERB').each((verb: any) => {
      const verbText = verb.out(its.value);
      // 查找相关的名词
      const relatedNouns: string[] = [];
      doc.tokens().filter((token: any) => token.out(its.pos) === 'NOUN').each((noun: any) => {
        const nounText = noun.out(its.value);
        // 简单的距离检查（在同一句子中）
        if (Math.abs(verb.span().begin() - noun.span().begin()) < 10) {
          relatedNouns.push(nounText);
        }
      });
      
      if (relatedNouns.length > 0) {
        relationships[`verb_${verbText}`] = relatedNouns;
      }
    });
    
    return relationships;
  }
  
  private extractVerbs(doc: any): string[] {
    // 提取所有动词形式
    const baseVerbs = doc.verbs().out('array');
    const presentVerbs = doc.verbs().toPresentTense().out('array');
    const pastVerbs = doc.verbs().toPastTense().out('array');
    
    // 合并并去重
    return uniq([...baseVerbs, ...presentVerbs, ...pastVerbs]);
  }
  
  private extractNouns(doc: any): string[] {
    // 提取名词及其变体
    const baseNouns = doc.nouns().out('array');
    const pluralNouns = doc.nouns().toPlural().out('array');
    const singularNouns = doc.nouns().toSingular().out('array');
    
    // 合并并去重
    return uniq([...baseNouns, ...pluralNouns, ...singularNouns]);
  }
  
  private extractAdjectives(doc: any): string[] {
    return doc.adjectives().out('array');
  }
  
  private detectFrameworkHints(text: string): FrameworkConventions {
    const hints: FrameworkConventions = {};
    
    // React 相关关键词检测
    if (/\b(hook|Hook|use[A-Z])\b/.test(text)) {
      hints.hookPrefix = ['use'];
    }
    
    // Vue 相关关键词检测
    if (/\b(vue|Vue|component)\b/.test(text)) {
      hints.componentSuffix = ['Component'];
    }
    
    // Angular 相关关键词检测
    if (/\b(angular|Angular|directive)\b/.test(text)) {
      hints.componentSuffix = ['Directive'];
    }
    
    return hints;
  }
  
  private performSemanticRoleLabeling(winkDoc: any, compromiseDoc: any): Record<string, string[]> {
    const roles: Record<string, string[]> = {};
    
    // 使用 wink-nlp 进行词性分析
    const verbs: string[] = [];
    const nouns: string[] = [];
    const adjectives: string[] = [];
    
    winkDoc.tokens().each((token: any) => {
      const pos = token.out(its.pos);
      const text = token.out(its.value);
      
      switch (pos) {
        case 'VERB':
          verbs.push(text);
          break;
        case 'NOUN':
          nouns.push(text);
          break;
        case 'ADJ':
          adjectives.push(text);
          break;
      }
    });
    
    // 识别语义角色
    if (verbs.length > 0) {
      roles['action'] = uniq(verbs);
    }
    
    if (nouns.length > 0) {
      roles['object'] = uniq(nouns);
    }
    
    if (adjectives.length > 0) {
      roles['modifier'] = uniq(adjectives);
    }
    
    return roles;
  }
}