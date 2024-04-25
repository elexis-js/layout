import 'elexis';
import { $Layout } from './lib/$Layout';
declare module 'elexis' {
    export namespace $ {
        export interface TagNameElementMap {
            'layout': typeof $Layout;
        } 
    }
}
$.registerTagName('layout', $Layout)

export * from './lib/$Layout'