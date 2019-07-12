import sketch from 'sketch'

export default function() {
  const selection = context.selection
  const layers = selection.count()

  if (layers === 1) {
    const currentPage = context.document.currentPage()
    const originalLayer = selection[0]
    const originalPath = originalLayer.pathInFrameWithTransforms()
    const roughenedPath = NSBezierPath.bezierPath()

    // Sorry, doesn't really work on text or bitmap layers
    if (selection[0].isKindOfClass(MSTextLayer) || selection[0].isKindOfClass(MSBitmapLayer)) {
      return sketch.UI.message('⚠️ You can only roughen shape paths.')
    }

    let size, detail

    let ROUGHEN = 1000
    let READY = true
    let CANCELLED = false
    let NOT_READY = null

    function soLetsGo() {
      let uiResponse = NOT_READY

      while (uiResponse === NOT_READY) {
        const dialog = createDialog()

        // Show dialog and process the results
        uiResponse = processButtonClick(dialog, dialog.runModal())

        switch (uiResponse) {
          case NOT_READY:
            sketch.UI.message('⚠️ Please enter a number.')
            break
          case READY:
            roughenIt()
            break
          case CANCELLED:
            break
        }
      }
    }

    function createDialog() {
      const dialogUI = COSAlertWindow.new()

      dialogUI.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed('icon.png').path()))
      dialogUI.setMessageText('Roughen Shape')
      dialogUI.setInformativeText('Roughens the path of the currently selected shape.')
      dialogUI.addTextLabelWithValue('Size')
      dialogUI.addTextFieldWithValue('5')
      dialogUI.addTextLabelWithValue('Detail')
      dialogUI.addTextFieldWithValue('2')
      dialogUI.addButtonWithTitle('Roughen')
      dialogUI.addButtonWithTitle('Cancel')

      // Allow tab to switch between inputs
      let findInput = dialogUI.viewAtIndex(1);
      let replaceWithInput = dialogUI.viewAtIndex(3);

      // focus on Find field on start
      dialogUI.alert().window().setInitialFirstResponder(findInput);

      findInput.setNextKeyView(replaceWithInput);
      replaceWithInput.setNextKeyView(findInput);

      return dialogUI
    }

    // Processes the result of the UI
    function processButtonClick(dialog, buttonClick) {
      let result

      if (buttonClick === ROUGHEN) {
        size = dialog.viewAtIndex(1).stringValue()
        detail = dialog.viewAtIndex(3).stringValue()

        // Make sure we have text to find
        if (size != '' && detail != '') {
          result = READY
        } else {
          result = NOT_READY
        }
      } else {
        result = CANCELLED
      }

      return result
    }

    function roughenIt() {
      // Returns a random number (based on user input) near the exact point
      const randomPoint = function(num) {
        return num + Math.random() * detail - detail / 2
      }

      const steps = originalPath.length() / size
      const startingPoint = originalPath.pointOnPathAtLength(0)

      // Create the first point of the new path
      roughenedPath.moveToPoint(NSMakePoint(startingPoint.x, startingPoint.y))

      // Loop through each step of the new path
      for (let i = 1; i <= steps; i++) {
        let point = originalPath.pointOnPathAtLength(size * i)

        // Create the new random point
        roughenedPath.lineToPoint(NSMakePoint(randomPoint(point.x), randomPoint(point.y)))
      }

      // Close the new path
      roughenedPath.closePath()

      // Create the new layer
      const roughenedLayer = MSShapeGroup.layerWithPath(MSPath.pathWithBezierPath(roughenedPath))

      // Set Name and Styles of roughened shape
      roughenedLayer.setName('Roughened ' + originalLayer.name())
      roughenedLayer.setStyle(originalLayer.style())

      // Add the roughened layer to the document
      currentPage.addLayers([roughenedLayer])

      // Remove the original layer from the document
      currentPage.removeLayer(originalLayer);

      sketch.UI.message('🎉 You roughened the shape!')
    }

    soLetsGo()
  } else {
    sketch.UI.message('⚠️ Please select only one layer.')
  }
}
