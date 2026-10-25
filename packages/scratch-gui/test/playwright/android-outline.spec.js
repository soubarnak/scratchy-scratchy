// @ts-check
const {test, expect} = require('@playwright/test');

test('Outline colour picker is above the Android paint canvas and receives taps', async ({page}) => {
    await page.goto('index.html');
    await expect(page.getByText('Costumes', {exact: true})).toBeVisible();
    await page.getByText('Costumes', {exact: true}).click();

    const paintToolbar = page.locator('[class*=paint-editor_editor-container-top]');
    const colorControls = paintToolbar.locator('[class*=paint-editor_mod-dashed-border_]');
    await expect(colorControls).toBeVisible();
    for (const width of [360, 390]) {
        await page.setViewportSize({width, height: 844});
        await paintToolbar.evaluate(element => {
            element.scrollLeft = 120;
        });
        const toolbarBox = await paintToolbar.boundingBox();
        const colorControlsBox = await colorControls.boundingBox();
        expect(colorControlsBox?.x ?? -1).toBeGreaterThanOrEqual((toolbarBox?.x ?? 0) - 1);
    }

    const outlineArrow = colorControls.locator('[class*=color-button_color-button-arrow]').nth(1);
    await expect(outlineArrow).toBeVisible();
    await outlineArrow.tap();

    const sheet = page.getByRole('dialog', {name: 'Outline color'});
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', {name: 'Fill', exact: true})).toBeVisible();
    await expect(sheet.getByRole('button', {name: 'Outline', exact: true})).toBeVisible();
    const swatch = sheet.getByRole('group', {name: 'Quick colors'})
        .getByRole('button', {name: 'Use color #FFAB19'});
    const swatchBox = await swatch.boundingBox();
    expect(swatchBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(swatchBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    const advanced = sheet.locator('details');
    await advanced.locator('summary').tap();
    const sliderHandle = advanced.locator('[class*=slider_large-touch-target]').first();
    const sliderBox = await sliderHandle.boundingBox();
    expect(sliderBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(sliderBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await sheet.getByRole('button', {name: 'Thick'}).tap();
    await expect(sheet.getByRole('img', {name: 'Outline preview, 4 pt'})).toBeVisible();
    const noOutline = sheet.getByRole('button', {name: 'No outline'});
    await expect(noOutline).toBeVisible();
    await noOutline.tap();
    await expect(sheet.getByRole('button', {name: 'Add outline'})).toBeVisible();
    await expect(sheet.getByRole('img', {name: 'Outline preview, 0 pt'})).toBeVisible();
    await sheet.getByRole('button', {name: 'Add outline'}).tap();
    await expect(sheet.getByRole('button', {name: 'No outline'})).toBeVisible();
    await expect(sheet.getByRole('img', {name: 'Outline preview, 4 pt'})).toBeVisible();

    await sheet.getByRole('group', {name: 'Quick colors'}).getByRole('button', {name: 'Use color #FFAB19'})
        .tap();
    await sheet.getByRole('button', {name: 'Apply'}).tap();
    const selectedOutlineSwatch = page.getByRole('button', {name: 'Outline color'})
        .locator('[class*=color-button_color-button-swatch]');
    await expect(selectedOutlineSwatch).toHaveCSS('background-color', 'rgb(255, 171, 25)');
    await outlineArrow.tap();
    const recentColors = page.getByRole('group', {name: 'Recent colors'});
    await expect(recentColors.getByRole('button', {name: 'Use color #FFAB19'})).toBeVisible();
    await expect(page.locator('.Popover-body')).toHaveCount(0);
});

test('Android Back dismisses the open Outline color sheet', async ({page}) => {
    await page.goto('index.html');
    await page.getByText('Costumes', {exact: true}).tap();
    await page.locator('[class*=color-button_color-button-arrow]')
        .nth(1)
        .tap();
    const sheet = page.getByRole('dialog', {name: 'Outline color'});
    await expect(sheet).toBeVisible();

    const backEventHandled = await page.evaluate(() => {
        const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true});
        document.dispatchEvent(event);
        return event.defaultPrevented;
    });
    expect(backEventHandled).toBe(true);
    await expect(sheet).toHaveCount(0);
});


test('compact overflow exposes Tutorials, Debug, and project title editing', async ({page}) => {
    await page.goto('index.html');
    const more = page.getByRole('button', {name: 'More editor options'});
    await expect(more).toBeVisible();
    await more.tap();
    await expect(page.getByRole('listitem').filter({hasText: 'Tutorials'})).toBeVisible();
    await expect(page.getByRole('listitem').filter({hasText: 'Debug'})).toBeVisible();
    await page.getByText('Edit project title', {exact: true}).tap();

    const titleDialog = page.getByRole('dialog', {name: 'Project title'});
    const titleInput = titleDialog.getByRole('textbox');
    await expect(titleInput).toBeFocused();
    await titleInput.fill('Mobile project');
    await titleInput.press('Enter');
    await expect(titleDialog).toHaveCount(0);
    await expect(page.locator('[class*=project-title-input_title-field]')).toHaveValue('Mobile project');
});

test('Outline sheet warns when the outline matches the fill', async ({page}) => {
    await page.goto('index.html');
    await page.getByText('Costumes', {exact: true}).tap();
    await page.getByRole('button', {name: 'Fill color'}).tap();

    const fillSheet = page.getByRole('dialog', {name: 'Fill color'});
    await fillSheet.getByRole('button', {name: 'Use color #FFAB19'}).tap();
    await fillSheet.getByRole('button', {name: 'Outline', exact: true}).tap();

    const outlineSheet = page.getByRole('dialog', {name: 'Outline color'});
    await outlineSheet.getByRole('button', {name: 'Use color #FFAB19'}).tap();
    await expect(outlineSheet.getByText('Same as fill — the outline may not be visible')).toBeVisible();
    await outlineSheet.getByRole('button', {name: 'Apply'}).tap();
});

test('Brush mode explains why Outline is unavailable and switches to Select', async ({page}) => {
    await page.goto('index.html');
    await page.getByText('Costumes', {exact: true}).tap();
    await page.getByRole('button', {name: 'Brush'}).tap();
    await page.getByRole('button', {name: 'Outline color'}).tap();

    const sheet = page.getByRole('dialog', {name: 'Outline color'});
    const explanation = sheet.getByText(
        'Outline borders vector shapes. Switch to Select to edit a shape outline.'
    );
    await expect(explanation).toBeVisible();
    await sheet.getByRole('button', {name: 'Switch to Select tool'}).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Select'})).toHaveClass(/is-selected/);
});

test('bitmap Outline help offers the existing convert-to-vector action', async ({page}) => {
    await page.goto('index.html');
    await page.getByText('Costumes', {exact: true}).tap();
    await page.getByRole('button', {name: 'Convert to Bitmap'}).tap();
    await page.getByRole('button', {name: 'Fill color'}).tap();
    const fillSheet = page.getByRole('dialog', {name: 'Fill color'});
    await fillSheet.getByRole('button', {name: 'Outline', exact: true}).tap();

    const outlineHelp = page.getByRole('dialog', {name: 'Outline color'});
    await expect(outlineHelp.getByText('Outline editing is available for vector costumes.')).toBeVisible();
    await outlineHelp.getByRole('button', {name: 'Convert to vector'}).tap();
    await expect(page.getByRole('button', {name: 'Convert to Bitmap'})).toBeVisible();
});

test('tapping a compact flyout block adds a block to the workspace', async ({page}) => {
    await page.goto('index.html');

    const workspaceBlocks = page.locator('.blocklyBlockCanvas')
        .first()
        .locator(':scope > .blocklyDraggable');
    const initialCount = await workspaceBlocks.count();
    const flyoutBlock = page.locator('.blocklyFlyout .motion_movesteps').first();
    await expect(flyoutBlock).toBeVisible();
    await flyoutBlock.tap({position: {x: 5, y: 18}});
    await expect.poll(() => workspaceBlocks.count()).toBe(initialCount + 1);
    const newBlockBox = await workspaceBlocks.first().boundingBox();
    const flyoutBox = await page.locator('.blocklyFlyout').boundingBox();
    expect(newBlockBox?.x ?? 0).toBeGreaterThanOrEqual((flyoutBox?.x ?? 0) + (flyoutBox?.width ?? 0));
});

test('dragging a compact flyout block still inserts it', async ({page}) => {
    await page.goto('index.html');

    const flyoutBlock = page.locator('.blocklyFlyout .motion_movesteps').first();
    const flyoutBox = await flyoutBlock.boundingBox();
    const workspaceBox = await page.locator('.blocklyMainBackground').boundingBox();
    expect(flyoutBox).not.toBeNull();
    expect(workspaceBox).not.toBeNull();
    const workspaceBlocks = page.locator('.blocklyBlockCanvas')
        .first()
        .locator(':scope > .blocklyDraggable');

    await page.mouse.move((flyoutBox?.x ?? 0) + 5, (flyoutBox?.y ?? 0) + 18);
    await page.mouse.down();
    await page.mouse.move((workspaceBox?.x ?? 0) + 275, (workspaceBox?.y ?? 0) + 240, {steps: 10});
    await page.mouse.up();
    await expect.poll(() => workspaceBlocks.count()).toBe(1);
});

test('the Create view keeps code, stage, and sprite switching together', async ({page}) => {
    await page.goto('index.html');

    const createView = page.getByRole('navigation', {name: 'Editor sections'});
    const navBox = await createView.boundingBox();
    const viewport = page.viewportSize();
    expect(navBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect((navBox?.y ?? Infinity) + (navBox?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);
    await expect(createView.getByRole('button', {name: 'Create'})).toBeVisible();
    await expect(createView.getByRole('button', {name: 'Sprites'})).toBeVisible();
    const workspace = page.locator('.blocklySvg');
    const stageCanvas = page.locator('canvas').first();
    await expect(workspace).toBeVisible();
    await expect(stageCanvas).toBeVisible();

    const stageBox = await stageCanvas.boundingBox();
    const workspaceBox = await workspace.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(workspaceBox).not.toBeNull();
    expect((stageBox?.y ?? 0) + (stageBox?.height ?? 0)).toBeLessThanOrEqual(workspaceBox?.y ?? 0);

    const spriteItems = page.locator('[aria-label="Project sprites"] [role="button"]');
    await expect(spriteItems.first()).toBeVisible();
    await spriteItems.first().tap();
    await expect(workspace).toBeVisible();
    await expect(stageCanvas).toBeVisible();

    const expandStage = page.getByRole('button', {name: 'Expand stage preview'});
    await expandStage.tap();
    await expect(page.getByRole('button', {name: 'Collapse stage preview'})).toHaveAttribute('aria-expanded', 'true');
    await expect(workspace).toBeVisible();

    await createView.getByRole('button', {name: 'Sprites'}).tap();
    await expect(page.getByRole('button', {name: 'Start project'})).toBeVisible();
    await expect(stageCanvas).toBeVisible();
    const targetPane = page.getByRole('region', {name: 'Target pane'});
    await expect(targetPane).toBeVisible();
    const visibleStageBox = await stageCanvas.boundingBox();
    const targetBox = await targetPane.boundingBox();
    expect(targetBox?.y ?? 0).toBeGreaterThanOrEqual(
        (visibleStageBox?.y ?? 0) + (visibleStageBox?.height ?? 0)
    );
});

test('tablet target pane collapses into a sprite rail and expands back', async ({page}) => {
    for (const viewport of [{width: 800, height: 1280}, {width: 768, height: 1024}]) {
        await page.setViewportSize(viewport);
        await page.goto('index.html');

        const targetPane = page.locator('[class*=target-pane_target-pane]');
        const spriteInfo = targetPane.locator('[class*=sprite-info_sprite-info]');
        const expandedBox = await targetPane.boundingBox();
        await expect(spriteInfo).toBeVisible();
        const collapse = page.getByRole('button', {name: 'Collapse sprite management'});
        await expect(collapse).toHaveAttribute('aria-expanded', 'true');
        await collapse.tap();
        const expand = page.getByRole('button', {name: 'Expand sprite management'});
        await expect(expand).toHaveAttribute('aria-expanded', 'false');
        await expect(spriteInfo).toBeHidden();
        const collapsedBox = await targetPane.boundingBox();
        expect(collapsedBox?.height ?? Infinity).toBeLessThan(100);
        expect(collapsedBox?.height ?? 0).toBeLessThan((expandedBox?.height ?? 0) / 3);
        await expand.tap();
        await expect(spriteInfo).toBeVisible();
    }
});

test('large tablet keeps the upstream layout without compact navigation', async ({page}) => {
    await page.setViewportSize({width: 1280, height: 800});
    await page.goto('index.html');

    await expect(page.getByRole('navigation', {name: 'Editor sections'})).toHaveCount(0);
    await expect(page.locator('.blocklySvg')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
});

test('landscape phone keeps the stage beside the code workspace', async ({page}) => {
    await page.setViewportSize({width: 844, height: 390});
    await page.goto('index.html');

    const workspaceBox = await page.locator('.blocklySvg')
        .boundingBox();
    const stageBox = await page.locator('canvas').first()
        .boundingBox();
    expect(workspaceBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(stageBox?.x ?? 0).toBeGreaterThan(workspaceBox?.x ?? 0);
    await expect(page.getByRole('navigation', {name: 'Editor sections'})).toBeVisible();
});
