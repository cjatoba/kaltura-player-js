import { EventManager } from '@playkit-js/playkit-js';
import { BaseStorageManager } from './base-storage-manager';
import { KalturaPlayer } from '../../kaltura-player';

export default class LocalStorageManager extends BaseStorageManager {
  public static StorageKeys: { [key: string]: string } = {
    MUTED: 'muted',
    VOLUME: 'volume',
    AUDIO_LANG: 'audioLanguage',
    TEXT_LANG: 'textLanguage',
    CAPTIONS_DISPLAY: 'captionsDisplay',
    TEXT_STYLE: 'textStyle'
  };

  public static initialize(): void {
    this.init(this.name);
  }

  public static getStorageObject(): Storage {
    return localStorage;
  }

  /**
   * Attaches the player listeners to the local storage wrapper.
   * @private
   * @param {Player} player - The player reference.
   * @static
   * @returns {void}
   */
  public static attach(player: KalturaPlayer): void {
    this._logger.debug('Attach local storage');
    const eventManager = new EventManager();
    eventManager.listen(player, player.Event.UI.USER_CLICKED_MUTE, () => {
      if (!player.isCasting()) {
        this.setItem(this.StorageKeys.MUTED, player.muted);
      }
    });
    eventManager.listen(player, player.Event.UI.USER_CLICKED_UNMUTE, () => {
      if (!player.isCasting()) {
        this.setItem(this.StorageKeys.MUTED, player.muted);
      }
    });

    eventManager.listen(player, player.Event.UI.USER_CHANGED_VOLUME, () => {
      if (!player.isCasting()) {
        this.setItem(this.StorageKeys.MUTED, !player.volume);
        this.setItem(this.StorageKeys.VOLUME, player.volume);
      }
    });

    eventManager.listen(player, player.Event.UI.USER_SELECTED_AUDIO_TRACK, (event) => {
      const audioTrack = event.payload.audioTrack;
      this.setItem(this.StorageKeys.AUDIO_LANG, audioTrack.language);
    });

    eventManager.listen(player, player.Event.UI.USER_SELECTED_CAPTION_TRACK, (event) => {
      const textTrack = event.payload.captionTrack;
      if (textTrack.language !== 'off') {
        this.setItem(this.StorageKeys.TEXT_LANG, textTrack.language);
        this.setItem(this.StorageKeys.CAPTIONS_DISPLAY, true);
      } else {
        this.setItem(this.StorageKeys.CAPTIONS_DISPLAY, false);
      }
    });

    const onToggleCaptions = (): any => {
      eventManager.listenOnce(player, player.Event.Core.TEXT_TRACK_CHANGED, (event) => {
        const { selectedTextTrack } = event.payload;
        if (selectedTextTrack.language !== 'off') {
          this.setItem(this.StorageKeys.TEXT_LANG, selectedTextTrack.language);
          this.setItem(this.StorageKeys.CAPTIONS_DISPLAY, true);
        } else {
          this.setItem(this.StorageKeys.CAPTIONS_DISPLAY, false);
        }
      });
    };

    eventManager.listen(player, player.Event.UI.USER_SHOWED_CAPTIONS, onToggleCaptions);
    eventManager.listen(player, player.Event.UI.USER_HID_CAPTIONS, onToggleCaptions);

    eventManager.listen(player, player.Event.UI.USER_SELECTED_CAPTIONS_STYLE, (event) => {
      try {
        const textStyle = JSON.stringify(event.payload.captionsStyle);
        this.setItem(this.StorageKeys.TEXT_STYLE, textStyle);
      } catch (e) {
        this._logger.error(e.message);
      }
    });

    eventManager.listen(player, player.Event.Core.PLAYER_DESTROY, () => eventManager.destroy());
  }

  /**
   * Gets the player text style from storage.
   * @private
   * @static
   * @returns {?Object} - The stored text style object
   */
  public static getPlayerTextStyle(): any | undefined {
    return this.getItem(this.StorageKeys.TEXT_STYLE);
  }
}
