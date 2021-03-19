import 'puppeteer-core';

declare module 'puppeteer-core' {
  interface Page {
    util: {
      /**
       * 等待元素出现并使用原生js点击
       * @param selector 元素选择器
       * @param options 等待元素的配置
       */
      evalClick(
        selector: string,
        options?: WaitForSelectorOptions,
      ): Promise<any>;

      /**
       * 等待元素出现并返回元素
       * @param selector 元素选择器
       * @param options 等待元素的配置
       */
      $wait(
        selector: string,
        options?: WaitForSelectorOptions,
      ): Promise<ElementHandle>;

      /**
       * 等待元素出现并返回元素
       * @param selector 元素选择器
       * @param options 等待元素的配置
       */
      $$wait(
        selector: string,
        options?: WaitForSelectorOptions,
      ): Promise<ElementHandle[]>;

      /**
       * 去掉所有的新标签页打开
       */
      removeTarget(): Promise<void>;

      /**
       * 页面滚动到底部
       */
      scrollDown(): Promise<void>;

      scroll(targetHeight: number): Promise<any>;

      /**
       *
       * @param min
       * @param max
       * @param unit 默认秒
       */
      wt(min: number, max: number, unit?: 'ms' | 's' | 'm' | 'h'): Promise<void>;
      wt(min: number, unit?: 'ms' | 's' | 'm' | 'h'): Promise<void>;

      /**
       *
       * @param selector
       * @param clickOptions
       * @param waitOptions
       */
      clickWaitForNavigation(
        selector: string,
        clickOptions?: ClickOptions,
        waitOptions?: WaitForOptions,
      ): Promise<HTTPResponse>;

      addScriptLodash(): Promise<void>;
    };
  }
}
