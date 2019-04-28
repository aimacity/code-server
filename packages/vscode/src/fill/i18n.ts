import { readFile, writeFile } from "fs";
import { promisify } from "util";
import * as paths from "./paths";
import { logger, field } from "@coder/logger";
import * as nls from "vs/nls";
/**
 * class for client i18n
 */
class LanguagePack {
    private readonly config: { dataDir: string};
    /**
     * read locale.json
     */
    private async readLocale(): Promise<string> {
        const file = paths._paths.appData + "/User" + "/locale.json";
        logger.info("try to load locale setting with path:" + file);
        return promisify(readFile)(file, "utf8");
    }
    /**
     * read locale from config file
     */
    public async getLocale(): Promise<string> {
			try {
                const contents =await this.readLocale();
				const json = JSON.parse(contents);
				if(json && json.locale) {
                    localStorage.setItem("locale",json.locale);
                    return json.locale;
                }
			} catch(e) {
				logger.error(e);
            }
            return "";
    }
    /**
     * init i18n for web client
     */
    public async initialize(): Promise<void> {
        const locale =await this.getLocale();
        logger.info("use locale:" + locale);
        if(locale) {
            const msgs = localStorage.getItem(locale);
            if (msgs) {
                logger.info("use cached locale:" + locale);
                (nls as any).addLocale(locale,JSON.parse(msgs));
            } else {
                const messages =await this.loadI18n(locale);
                if(messages ) {
                    (nls as any).addLocale(locale,messages);
                    localStorage.setItem(locale,JSON.stringify(messages));
                }
            }
        }
    }
    private  async readPack(locale:string): Promise<object> {
        const file = paths._paths.appData + "/languagepacks.json";
        const packs = await promisify(readFile)(file, "utf8");
       const cfg =  JSON.parse(packs);
       return cfg;
    }
    /**
     * load messages for locale
     * @param locale  locale
     */
    private  async loadI18n(locale:string): Promise<any> {
        const msgs = {};
        try {
           const cfg = await this.readPack(locale);
           if(cfg&&cfg[locale]&&cfg[locale]["translations"]) {
               const mainFile = cfg[locale]["translations"]["vscode"];
               const content = await promisify(readFile)(mainFile, "utf8");
               const data = JSON.parse(content);
               for(let p in data.contents)   {
                let sub = data.contents[p];
                if(sub) {
                    for(let key in sub) {
                       msgs[key] = sub[key];
                    }
                }
            }
            return msgs;
           }
        } catch (e) {
             // console.error('load zh-cn i 18 failed');
            return null;
        }
    }
}
export const lp = new LanguagePack();
