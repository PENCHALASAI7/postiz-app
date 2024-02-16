'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from '@gitroom/react/form/button';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import MDEditor from '@uiw/react-md-editor';
import { useHideTopEditor } from '@gitroom/frontend/components/launches/helpers/use.hide.top.editor';
import { useValues } from '@gitroom/frontend/components/launches/helpers/use.values';
import { FormProvider } from 'react-hook-form';
import { useMoveToIntegrationListener } from '@gitroom/frontend/components/launches/helpers/use.move.to.integration';

// This is a simple function that if we edit in place, we hide the editor on top
export const EditorWrapper: FC = (props) => {
  const showHide = useHideTopEditor();
  useEffect(() => {
    showHide.hide();
    return () => {
      showHide.show();
    };
  }, []);

  return null;
};

export const withProvider = (SettingsComponent: FC, PreviewComponent: FC) => {
  return (props: {
    identifier: string;
    id: string;
    value: string[];
    show: boolean;
  }) => {
    const [editInPlace, setEditInPlace] = useState(false);
    const [InPlaceValue, setInPlaceValue] = useState(['']);
    const [showTab, setShowTab] = useState(0);

    // in case there is an error on submit, we change to the settings tab for the specific provider
    useMoveToIntegrationListener(true, (identifier) => {
      if (identifier === props.identifier) {
        setShowTab(2);
      }
    });

    // this is a smart function, it updates the global value without updating the states (too heavy) and set the settings validation
    const form = useValues(
      props.identifier,
      props.id,
      editInPlace ? InPlaceValue : props.value
    );

    // change editor value
    const changeValue = useCallback(
      (index: number) => (newValue: string) => {
        return setInPlaceValue((prev) => {
          prev[index] = newValue;
          return [...prev];
        });
      },
      [InPlaceValue]
    );

    // add another local editor
    const addValue = useCallback(
      (index: number) => () => {
        setInPlaceValue((prev) => {
          prev.splice(index + 1, 0, '');
          return [...prev];
        });
      },
      [InPlaceValue]
    );

    // This is a function if we want to switch from the global editor to edit in place
    const changeToEditor = useCallback(
      (editor: boolean) => async () => {
        if (
          editor &&
          !editInPlace &&
          !(await deleteDialog(
            'Are you sure you want to edit in place?',
            'Yes, edit in place!'
          ))
        ) {
          return false;
        }
        setShowTab(editor ? 1 : 0);
        if (editor && !editInPlace) {
          setEditInPlace(true);
          setInPlaceValue(props.value);
        }
      },
      [props.value, editInPlace]
    );

    if (!props.show) {
      return null;
    }

    return (
      <FormProvider {...form}>
        <div className="mt-[15px]">
          {editInPlace && <EditorWrapper />}
          <div className="flex">
            <div>
              <Button secondary={showTab !== 0} onClick={changeToEditor(false)}>
                Preview
              </Button>
            </div>
            <div>
              <Button secondary={showTab !== 2} onClick={() => setShowTab(2)}>
                Settings
              </Button>
            </div>
            <div>
              <Button secondary={showTab !== 1} onClick={changeToEditor(true)}>
                Editor
              </Button>
            </div>
          </div>
          {showTab === 1 && (
            <div className="flex flex-col gap-[20px]">
              {InPlaceValue.map((val, index) => (
                <>
                  <MDEditor
                    key={`edit_inner_${index}`}
                    height={InPlaceValue.length > 1 ? 200 : 500}
                    value={val}
                    preview="edit"
                    // @ts-ignore
                    onChange={changeValue(index)}
                  />
                  <div>
                    <Button onClick={addValue(index)}>Add post</Button>
                  </div>
                </>
              ))}
            </div>
          )}
          {showTab === 2 && <SettingsComponent />}
          {showTab === 0 && <PreviewComponent />}
        </div>
      </FormProvider>
    );
  };
};