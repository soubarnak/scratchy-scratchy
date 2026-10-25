import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, useIntl} from 'react-intl';

import DragConstants from '../../lib/drag-constants';
import SpriteSelectorItem from '../../containers/sprite-selector-item.jsx';
import styles from './mobile-sprite-rail.css';

const messages = defineMessages({
    addSprite: {
        id: 'gui.mobileSpriteRail.addSprite',
        defaultMessage: 'Add sprite',
        description: 'Accessible label for adding a sprite from the mobile sprite rail'
    },
    label: {
        id: 'gui.mobileSpriteRail.label',
        defaultMessage: 'Project sprites',
        description: 'Accessible label for the compact sprite switching rail'
    }
});

const MobileSpriteRail = ({editingTarget, onAddSprite, onSelectSprite, sprites}) => {
    const intl = useIntl();
    const items = Object.values(sprites).sort((left, right) => left.order - right.order);

    return (
        <div className={styles.rail}>
            <div
                aria-label={intl.formatMessage(messages.label)}
                className={styles.spriteList}
                role="list"
            >
                {items.map((sprite, index) => (
                    <div
                        className={styles.spriteListItem}
                        key={sprite.id}
                        role="listitem"
                    >
                        <SpriteSelectorItem
                            asset={sprite.costume && sprite.costume.asset}
                            className={styles.spriteItem}
                            dragPayload={sprite.id}
                            dragType={DragConstants.SPRITE}
                            id={sprite.id}
                            index={index}
                            name={sprite.name}
                            selected={sprite.id === editingTarget}
                            onClick={onSelectSprite}
                        />
                    </div>
                ))}
            </div>
            <button
                aria-label={intl.formatMessage(messages.addSprite)}
                className={styles.addSprite}
                onClick={onAddSprite}
                type="button"
            >
                <span aria-hidden="true">＋</span>
            </button>
        </div>
    );
};

MobileSpriteRail.propTypes = {
    editingTarget: PropTypes.string,
    onAddSprite: PropTypes.func.isRequired,
    onSelectSprite: PropTypes.func.isRequired,
    sprites: PropTypes.objectOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        order: PropTypes.number.isRequired
    })).isRequired
};

export default MobileSpriteRail;
