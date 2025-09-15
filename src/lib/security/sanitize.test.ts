import { sanitizeInput } from './sanitize';

describe('sanitizeInput', () => {
  describe('Basic functionality', () => {
    it('should return plain text unchanged', () => {
      const input = 'Hello, world!';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should preserve alphanumeric characters and basic punctuation', () => {
      const input = 'Test123! @#$%^&*()_+-={}[]|:";\'<>?,./`~';
      const result = sanitizeInput(input);
      // < and > characters are stripped by XSS library for security
      expect(result).toBe('Test123! @#$%^&*()_+-={}[]|:";\'?,./`~');
    });

    it('should preserve spaces and line breaks', () => {
      const input = 'Line one\nLine two\n\nLine four';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });
  });

  describe('HTML tag removal', () => {
    it('should strip basic HTML tags', () => {
      const input = '<p>Hello</p>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should strip multiple HTML tags', () => {
      const input = '<div><p>Hello</p><span>world</span></div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Helloworld');
    });

    it('should strip nested HTML tags', () => {
      const input = '<div><p><strong><em>Nested text</em></strong></p></div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Nested text');
    });

    it('should strip self-closing tags', () => {
      const input = 'Before<br/>After<hr/>End';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfterEnd');
    });

    it('should strip tags with attributes', () => {
      const input =
        '<div class="test" id="main" style="color:red">Content</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Content');
    });
  });

  describe('Script tag handling', () => {
    it('should remove script tags and their content', () => {
      const input = 'Before<script>alert("XSS")</script>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });

    it('should remove script tags with attributes', () => {
      const input =
        'Before<script type="text/javascript" src="evil.js">alert("XSS")</script>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });

    it('should remove multiple script tags', () => {
      const input =
        '<script>alert("1")</script>Text<script>alert("2")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
    });

    it('should handle script tags with complex JavaScript', () => {
      const input =
        'Before<script>function hack(){document.cookie="stolen";}hack();</script>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });

    it('should remove inline script handlers', () => {
      const input = '<img onerror="alert(\'XSS\')" src="invalid.jpg">Text';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
    });
  });

  describe('Style tag handling', () => {
    it('should remove style tags and their content', () => {
      const input = 'Before<style>body{background:red}</style>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });

    it('should remove style tags with attributes', () => {
      const input =
        'Before<style type="text/css" media="screen">body{color:blue}</style>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });

    it('should remove multiple style tags', () => {
      const input =
        '<style>body{color:red}</style>Text<style>.test{color:blue}</style>';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
    });

    it('should handle style tags with complex CSS', () => {
      const input =
        'Before<style>@import url("evil.css"); .hack{expression(alert("XSS"));}</style>After';
      const result = sanitizeInput(input);
      expect(result).toBe('BeforeAfter');
    });
  });

  describe('XSS attack vectors', () => {
    it('should prevent basic script injection', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')"/>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should prevent JavaScript URL injection', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      const result = sanitizeInput(input);
      expect(result).toBe('Click me');
      expect(result).not.toContain('javascript:');
    });

    it('should prevent iframe injection', () => {
      const input = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('iframe');
    });

    it('should prevent object/embed injection', () => {
      const input =
        '<object data="data:text/html,<script>alert(\'XSS\')</script>"></object>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('object');
    });

    it('should prevent form injection', () => {
      const input =
        '<form action="evil.php"><input type="hidden" name="password" value="stolen"></form>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('form');
    });

    it('should prevent meta refresh injection', () => {
      const input =
        '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('meta');
    });
  });

  describe('Advanced XSS scenarios', () => {
    it('should handle case variations in script tags', () => {
      const input = '<ScRiPt>alert("XSS")</ScRiPt>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('alert');
    });

    it('should handle case variations in style tags', () => {
      const input = '<StYlE>body{background:red}</StYlE>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });

    it('should preserve HTML entity encoded scripts as entities', () => {
      const input = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const result = sanitizeInput(input);
      // XSS library preserves HTML entities and doesn't decode them
      expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should handle mixed case and malformed tags', () => {
      const input = '<ScRiPt defer>alert("XSS");</ScRiPt>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });

    it('should prevent data URI XSS', () => {
      const input =
        '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSkgLz4="/>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('data:');
    });
  });

  describe('HTML entities and special characters', () => {
    it('should preserve HTML entities as entities', () => {
      const input =
        '&lt;test&gt; &amp; &quot;quotes&quot; &apos;apostrophe&apos;';
      const result = sanitizeInput(input);
      // XSS library preserves HTML entities without decoding them
      expect(result).toBe(
        '&lt;test&gt; &amp; &quot;quotes&quot; &apos;apostrophe&apos;',
      );
    });

    it('should preserve numeric HTML entities as entities', () => {
      const input = '&#60;&#62; &#38; &#34; &#39;';
      const result = sanitizeInput(input);
      // XSS library preserves numeric HTML entities without decoding them
      expect(result).toBe('&#60;&#62; &#38; &#34; &#39;');
    });

    it('should handle Unicode characters', () => {
      const input = '🚀 Hello 世界 café naïve résumé';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should handle special symbols', () => {
      const input = `© ® ™ € £ ¥ § ¶ † ‡ • … ‰ ′ ″ ‹ › « » ‚ „`;
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed HTML', () => {
      const input = '<div><p>Unclosed paragraph<div>Another div</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Unclosed paragraphAnother div');
    });

    it('should handle comments', () => {
      const input = '<!-- This is a comment -->Text<!-- Another comment -->';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
    });

    it('should handle CDATA sections', () => {
      const input = 'Before<![CDATA[Some data]]>After';
      const result = sanitizeInput(input);
      // XSS library strips CDATA sections including their content
      expect(result).toBe('BeforeAfter');
    });

    it('should handle very long input', () => {
      const longText = 'A'.repeat(10000);
      const input = `<script>alert("XSS")</script>${longText}`;
      const result = sanitizeInput(input);
      expect(result).toBe(longText);
      expect(result).not.toContain('script');
    });

    it('should handle input with only whitespace', () => {
      const input = '   \n\t\r   ';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should handle deeply nested tags', () => {
      let input = 'Text';
      for (let i = 0; i < 100; i++) {
        input = `<div>${input}</div>`;
      }
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('Real-world attack scenarios', () => {
    it('should prevent SVG-based XSS', () => {
      const input = '<svg onload="alert(\'XSS\')"><circle r="10"/></svg>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('onload');
    });

    it('should prevent CSS expression injection', () => {
      const input =
        '<div style="background:expression(alert(\'XSS\'))">Text</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
      expect(result).not.toContain('expression');
    });

    it('should prevent link injection', () => {
      const input = '<link rel="stylesheet" href="javascript:alert(\'XSS\')">';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('link');
    });

    it('should prevent base tag injection', () => {
      const input = '<base href="javascript:alert(\'XSS\')//">';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('base');
    });

    it('should handle multiple attack vectors in one input', () => {
      const input = `
        <script>alert("script")</script>
        <img src="x" onerror="alert('img')"/>
        <iframe src="javascript:alert('iframe')"></iframe>
        <style>body{background:expression(alert('css'))}</style>
        Regular text here
      `;
      const result = sanitizeInput(input);
      expect(result).toContain('Regular text here');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('script');
      expect(result).not.toContain('iframe');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('expression');
    });
  });

  describe('Performance and boundary conditions', () => {
    it('should handle input with many tags', () => {
      const input = Array(1000).fill('<span>text</span>').join('');
      const result = sanitizeInput(input);
      expect(result).toBe('text'.repeat(1000));
      expect(result).not.toContain('<');
    });

    it('should handle mixed content efficiently', () => {
      const input = Array(100)
        .fill('text <script>alert(1)</script> more text')
        .join(' ');
      const result = sanitizeInput(input);
      expect(result).toContain('text  more text');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });
  });
});
