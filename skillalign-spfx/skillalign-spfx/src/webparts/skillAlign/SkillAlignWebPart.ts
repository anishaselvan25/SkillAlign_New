import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'SkillAlignWebPartStrings';

import appCss from './app/styles.css.txt';
import localConfigJs from './app/local-config.js.txt';
import localAuthJs from './app/local-auth.js.txt';
import localDataJs from './app/local-data.js.txt';
import smeManagementJs from './app/sme-management-local.js.txt';
import appJs from './app/app.js.txt';

export interface ISkillAlignWebPartProps {
  description: string;
}

export default class SkillAlignWebPart extends BaseClientSideWebPart<ISkillAlignWebPartProps> {

  private _styleElement: HTMLStyleElement | null = null;

  public render(): void {
    // Create the root container matching the original index.html
    this.domElement.innerHTML = '<div id="root"><div class="loading">Loading SkillAlign...</div></div>';

    // Inject the CSS
    this._injectStyles();

    // Execute JS modules in the correct order (matching original index.html script order)
    const scripts: string[] = [
      localConfigJs,
      localAuthJs,
      localDataJs,
      smeManagementJs,
      appJs
    ];

    scripts.forEach((code: string) => {
      const scriptEl: HTMLScriptElement = document.createElement('script');
      scriptEl.textContent = code;
      document.body.appendChild(scriptEl);
    });
  }

  private _injectStyles(): void {
    // Remove previous style if re-rendering
    if (this._styleElement) {
      this._styleElement.remove();
    }

    this._styleElement = document.createElement('style');
    this._styleElement.textContent = appCss;
    document.head.appendChild(this._styleElement);
  }

  protected onDispose(): void {
    // Clean up injected styles when web part is removed
    if (this._styleElement) {
      this._styleElement.remove();
      this._styleElement = null;
    }
    super.onDispose();
  }

  protected onInit(): Promise<void> {
    return Promise.resolve();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
