import sketch from 'sketch'

export default function() {
  const selection = context.selection
  const layers = selection.count()

  if (layers === 1) {
    const currentPage = context.document.currentPage()
    const originalLayer = selection[0]
    const originalPath = originalLayer.pathInFrameWithTransforms()
    const roughenedPath = NSBezierPath.bezierPath()

    let size, detail

    sketch.UI.getInputFromUser(
      "Size in pixels",
      { initialValue: '5' },
      (err, value) => {
        if (err) {
          return
        } else {
          size = value
        }
      }
    )

    sketch.UI.getInputFromUser(
      "Level of detail in pixels",
      { initialValue: '2' },
      (err, value) => {
        if (err) {
          return
        } else {
          detail = value
        }
      }
    )

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
  } else {
    sketch.UI.message('⚠️ Please select only one layer.')
  }
}
