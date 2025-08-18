import { NamingStyle } from '../../types';
import {
  camelCase,
  kebabCase,
  snakeCase,
  startCase
} from 'lodash';

export class StyleConverter {
  convert(name: string, style: NamingStyle): string {
    switch (style) {
      case 'snake_case':
        return snakeCase(name);
      case 'PascalCase':
        return startCase(camelCase(name)).replace(/\s/g, '');
      case 'kebab-case':
        return kebabCase(name);
      default: // camelCase
        return camelCase(name);
    }
  }
}