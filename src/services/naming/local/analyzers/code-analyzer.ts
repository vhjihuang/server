import * as fs from 'fs/promises';
import path from 'path';
import { FrameworkConventions, ProjectContext } from '../../types'; 
import { logger } from "../../../logger"; 

// 临时的内部类型，用于在分析过程中收集原始数据
interface TempProjectAnalysisResult {
  projectVerbs: Map<string, number>;
  projectNouns: Map<string, number>;
}

export class ProjectCodeAnalyzer {
  private fileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.vue'];
  private ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'build']);

  /**
   * 分析项目代码，推断并返回框架命名约定。
   * 注意：此处的推断是简化的，实际应用可能需要更复杂的规则。
   * @param projectRoot 项目根目录。
   * @param context 可选的项目上下文，用于指导分析。
   * @returns 包含推断出的框架命名约定的 Promise。
   */
  async analyze(projectRoot: string, context?: ProjectContext): Promise<FrameworkConventions> { 
    const tempResult: TempProjectAnalysisResult = {
      projectVerbs: new Map(),
      projectNouns: new Map()
    };

    logger.info(`开始分析项目目录: ${projectRoot}`);
    try {
      // 检查项目根目录是否存在且可读
      const stats = await fs.stat(projectRoot);
      if (!stats.isDirectory()) {
        logger.error(`提供的路径不是一个目录: ${projectRoot}`);
        return {};
      }
      await this.analyzeDirectory(projectRoot, tempResult);
      logger.info(`项目目录分析完成: ${projectRoot}`);
    } catch (error) {
      logger.error('项目分析失败', error as Error, { projectRoot }); 
    }

    // 将临时的动词/名词频率映射到 FrameworkConventions 结构
    return this.convertToFrameworkConventions(tempResult);
  }

  private async analyzeDirectory(
    dirPath: string,
    tempResult: TempProjectAnalysisResult 
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (this.ignoredDirectories.has(entry.name) || entry.name.startsWith('.')) { 
            continue;
          }
          await this.analyzeDirectory(fullPath, tempResult);
        } else if (
          entry.isFile() && 
          this.fileExtensions.includes(path.extname(entry.name))
        ) {
          await this.analyzeFile(fullPath, tempResult);
        }
      }
    } catch (error) {
      logger.warn(`无法读取目录或权限不足: ${dirPath}`, { errorMessage: (error as Error).message, dirPath });
    }
  }

  private async analyzeFile(
    filePath: string,
    tempResult: TempProjectAnalysisResult 
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.extractPatterns(content, tempResult);
    } catch (error) {
      logger.warn(`文件分析失败: ${filePath}`, { errorMessage: (error as Error).message, filePath });
    }
  }

  private extractPatterns(
    code: string,
    { projectVerbs, projectNouns }: TempProjectAnalysisResult 
  ): void {
    const functionMatches = code.matchAll(
      /(?:function\s+([a-zA-Z_$]\w*)|(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*(?:function|\(|\{|async\s*function|\([^)]*\)\s*=>))/g
    );
    
    for (const match of functionMatches) {
      const name = match[1] || match[2]; 
      if (name && !name.startsWith('_') && name.length > 1) { 
        const verb = this.extractLeadingVerb(name);
        if (verb) {
          projectVerbs.set(verb, (projectVerbs.get(verb) || 0) + 1);
        }
      }
    }

    const variableMatches = code.matchAll(
      /(?:const|let|var)\s+([a-zA-Z_$]\w*)(?!\s*=\s*(?:function|\(|\{|class\b|async\s*function))/g
    );
    
    for (const match of variableMatches) {
      const name = match[1];
      if (name && !name.startsWith('_') && name.length > 1) { 
        const normalized = name
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .toLowerCase();
        projectNouns.set(normalized, (projectNouns.get(normalized) || 0) + 1);
      }
    }
    
    const componentHookStoreMatches = code.matchAll(
        /\b(?:[A-Z][a-zA-Z0-9]*Component|use[A-Z][a-zA-Z0-9]*|.*Store)\b/g
    );
    for (const match of componentHookStoreMatches) {
        const name = match[0];
        if (name) {
            const normalized = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
            projectNouns.set(normalized, (projectNouns.get(normalized) || 0) + 1);
        }
    }
  }

  private extractLeadingVerb(name: string): string | null {
    const verbMatch = name.match(/^([a-z]+)(?=[A-Z]|$)/);
    // 修正此处：使用可选链 ?. 安全地访问捕获组
    return verbMatch ? verbMatch[1]?.toLowerCase() || null : null; 
  }

  /**
   * 将内部分析结果转换为 FrameworkConventions 结构。
   * 此处为简化实现，只选取最常用的动词/名词作为示例约定。
   * 实际的推断逻辑应更复杂，可能需要基于文件路径、命名模式等。
   * 例如，可以分析文件路径 `/components/` 下的命名，`hooks/` 下的命名。
   */
  private convertToFrameworkConventions(tempResult: TempProjectAnalysisResult): FrameworkConventions {
    const conventions: FrameworkConventions = {};

    const topVerbs = Array.from(tempResult.projectVerbs.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3) 
      .map(([verb]) => verb);

    const topNouns = Array.from(tempResult.projectNouns.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3) 
      .map(([noun]) => noun);
    
    if (topVerbs.includes('use')) {
      conventions.hookPrefix = ['use'];
    }
    if (topNouns.some(n => ['list', 'form', 'view', 'modal', 'card'].includes(n.split(' ').pop() || ''))) {
      conventions.componentSuffix = ['View', 'Container', 'Component'];
    }
    if (topNouns.some(n => n.includes('store'))) {
      conventions.storePattern = ['*Store', 'use*Store'];
    }

    return conventions;
  }
}