import { Container, Button } from 'pcui';

class FeedbackPanel extends Container {
    constructor(args: Record<string, any> = {}) {
        Object.assign(args, {
            id: 'feedback-pane'
        });

        super(args);

        const group = new Container({
            flex: true,
            flexDirection: 'row'
        });

        // flexGrow missing from ButtonArgs (PCUI bug)
        const githubButton = new Button({
            text: 'GITHUB',
            icon: '\E259',
            flexGrow: '1'
        } as any);

        githubButton.on('click', () => {
            window.open('https://github.com/playcanvas/texture-tool');
        });

        group.append(githubButton);
        this.append(group);
    }
}

export {
    FeedbackPanel
};
