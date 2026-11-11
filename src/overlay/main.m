#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface OverlayAppDelegate : NSObject <NSApplicationDelegate>
@property (strong, nonatomic) NSWindow *window;
@end

@implementation OverlayAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

    NSScreen *screen = [NSScreen mainScreen];
    NSRect screenRect = [screen frame];
    NSRect windowRect = NSMakeRect(0, screenRect.size.height - 220, screenRect.size.width, 220);

    self.window = [[NSWindow alloc] initWithContentRect:windowRect
                                              styleMask:NSWindowStyleMaskBorderless
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];

    [self.window setOpaque:NO];
    [self.window setBackgroundColor:[NSColor clearColor]];
    [self.window setHasShadow:NO];
    [self.window setLevel:NSFloatingWindowLevel];
    [self.window setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                                       NSWindowCollectionBehaviorStationary |
                                       NSWindowCollectionBehaviorFullScreenAuxiliary];
    
    // Ignore mouse events so clicks pass right through to Antigravity / Dota
    [self.window setIgnoresMouseEvents:YES];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    WKWebView *webView = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, windowRect.size.width, windowRect.size.height)
                                            configuration:config];
    [webView setValue:@NO forKey:@"drawsBackground"];
    [webView setAutoresizingMask:NSViewWidthSizable | NSViewHeightSizable];

    NSURL *url = [NSURL URLWithString:@"http://localhost:3000/overlay"];
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    [webView loadRequest:request];

    [self.window setContentView:webView];
    [self.window orderFrontRegardless];

    printf("\n🚀 DotaPilot прозорий оверлей активовано!\n");
    printf("💡 Вікно зафіксоване вгорі екрана, фон повністю прозорий, а кліки пролітають крізь нього.\n\n");
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        OverlayAppDelegate *delegate = [[OverlayAppDelegate alloc] init];
        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
