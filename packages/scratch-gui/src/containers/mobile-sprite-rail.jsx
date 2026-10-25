import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {openSpriteLibrary} from '../reducers/modals';
import MobileSpriteRailComponent from '../components/mobile-sprite-rail/mobile-sprite-rail.jsx';

const MobileSpriteRail = () => {
    const dispatch = useDispatch();
    const editingTarget = useSelector(state => state.scratchGui.targets.editingTarget);
    const sprites = useSelector(state => state.scratchGui.targets.sprites);
    const vm = useSelector(state => state.scratchGui.vm);

    const onAddSprite = useCallback(() => dispatch(openSpriteLibrary()), [dispatch]);
    const onSelectSprite = useCallback(id => vm.setEditingTarget(id), [vm]);

    return (
        <MobileSpriteRailComponent
            editingTarget={editingTarget}
            onAddSprite={onAddSprite}
            onSelectSprite={onSelectSprite}
            sprites={sprites}
        />
    );
};

export default MobileSpriteRail;
